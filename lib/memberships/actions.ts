"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/memberships/current-member";
import { inviteMember } from "@/lib/memberships/invite";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
	const supabase = await createServerClient();
	const email = String(formData.get("email") ?? "")
		.trim()
		.toLowerCase();
	const password = String(formData.get("password") ?? "");

	if (!email || !password) {
		redirect("/auth/login?error=invalid");
	}

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		// Anti-enumeration: same message whether the account does not exist or
		// the password is wrong (docs/research/supabase-auth.md).
		redirect(`/auth/login?error=invalid&email=${encodeURIComponent(email)}`);
	}

	// Only members with an active membership can use the app (SPEC §2.1,
	// ADR 0005). A member who left (baja) keeps their contributions but cannot
	// sign in; an invited member must first accept the invitation.
	const { data: member } = await supabase
		.from("members")
		.select("status")
		.eq("id", data.user.id)
		.maybeSingle();

	if (!member || member.status !== "active") {
		await supabase.auth.signOut();
		redirect(
			`/auth/login?error=${member?.status === "left" ? "left" : "pending"}`,
		);
	}

	redirect("/");
}

export async function signOut() {
	const supabase = await createServerClient();
	await supabase.auth.signOut();
	redirect("/auth/login");
}

export async function invite(formData: FormData) {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	const email = String(formData.get("email") ?? "");

	const result = await inviteMember({
		email,
		padrinoId: member.id,
		padrinoDisplayName: member.display_name,
	});

	if (!result.ok) {
		redirect(`/invite?error=${result.code}`);
	}

	revalidatePath("/invite");
	redirect("/invite?invited=1");
}

export type AcceptInvitationState = {
	error: "invalid" | "update_failed" | "invalid_or_expired";
} | null;

/**
 * The invitee completes their sign-up: sets a password and a display name,
 * which activates the membership (invited -> active, ADR 0005).
 *
 * This is a server action with the service role client: the members UPDATE
 * (and the invitation UPDATE) are deliberately server-side — there is no
 * members UPDATE policy, so a member can never self-promote via the Data API.
 * The caller must hold a session for the invited user (the invite link) and
 * their members row must still be 'invited' with a live invitation.
 *
 * Returns an error code (the page shows it) or redirects to "/" on success.
 */
export async function acceptInvitation(
	_prev: AcceptInvitationState,
	formData: FormData,
): Promise<AcceptInvitationState> {
	const supabase = await createServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "invalid_or_expired" };
	}

	const displayName = String(formData.get("displayName") ?? "").trim();
	const password = String(formData.get("password") ?? "");

	if (password.length < 6 || !displayName) {
		return { error: "invalid" };
	}

	const admin = createAdminClient();

	// The session must belong to an invited member: an active or left member
	// reaching this page (stale link, second submit) is not re-activated.
	const { data: member } = await admin
		.from("members")
		.select("id, status")
		.eq("id", user.id)
		.maybeSingle();

	if (!member || member.status !== "invited") {
		return { error: "invalid_or_expired" };
	}

	// The live invitation must not have expired: the invite link is valid for
	// 24h (SPEC §9) and a persisted session must not outlive it.
	const { data: invitation } = await admin
		.from("invitations")
		.select("id, expires_at")
		.eq("email", user.email ?? "")
		.eq("status", "pending")
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (!invitation || new Date(invitation.expires_at).getTime() <= Date.now()) {
		return { error: "invalid_or_expired" };
	}

	// Set the password and the display name (user_metadata).
	const { error: updateError } = await admin.auth.admin.updateUserById(
		user.id,
		{
			password,
			user_metadata: { display_name: displayName },
		},
	);

	if (updateError) {
		return { error: "update_failed" };
	}

	// Activate the membership.
	const { error: memberError } = await admin
		.from("members")
		.update({ status: "active", display_name: displayName })
		.eq("id", user.id);

	if (memberError) {
		return { error: "update_failed" };
	}

	// Mark the padrinazgo as accepted. Same email, live invitation.
	const { error: invitationError } = await admin
		.from("invitations")
		.update({ status: "accepted" })
		.eq("email", user.email ?? "")
		.eq("status", "pending");

	if (invitationError) {
		return { error: "update_failed" };
	}

	redirect("/");
}

export async function updateProfile(formData: FormData) {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}
	if (member.status !== "active") {
		redirect("/");
	}

	const displayName = String(formData.get("displayName") ?? "").trim();

	if (displayName && displayName !== member.display_name) {
		// Service role: members has no UPDATE policy (self-edit via the Data
		// API would allow self-promotion); profile edits are server-side.
		const admin = createAdminClient();
		const { error } = await admin
			.from("members")
			.update({ display_name: displayName })
			.eq("id", member.id);

		if (error) {
			redirect("/profile?error=update_failed");
		}
	}

	revalidatePath("/profile");
	redirect("/profile?updated=1");
}

export async function leaveClub() {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}
	if (member.status !== "active") {
		redirect("/");
	}

	// Service role: same reason as updateProfile — the status transition is
	// server-side (ADR 0005).
	const admin = createAdminClient();
	const { error } = await admin
		.from("members")
		.update({ status: "left" })
		.eq("id", member.id);

	if (error) {
		redirect("/profile?error=leave_failed");
	}

	const supabase = await createServerClient();
	await supabase.auth.signOut();
	redirect("/auth/login?error=left");
}

export async function requestPasswordReset(formData: FormData) {
	const supabase = await createServerClient();
	const email = String(formData.get("email") ?? "")
		.trim()
		.toLowerCase();

	if (!email) {
		redirect("/auth/reset?error=invalid");
	}

	// Anti-enumeration: resetPasswordForEmail never reveals whether the email
	// exists. Same response regardless.
	await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
	});

	redirect("/auth/reset?sent=1");
}
