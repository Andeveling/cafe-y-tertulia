"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/memberships/current-member";
import { inviteMember } from "@/lib/memberships/invite";
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

export async function updateProfile(formData: FormData) {
	const supabase = await createServerClient();
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	const displayName = String(formData.get("displayName") ?? "").trim();

	if (displayName && displayName !== member.display_name) {
		const { error } = await supabase
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
	const supabase = await createServerClient();
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	const { error } = await supabase
		.from("members")
		.update({ status: "left" })
		.eq("id", member.id);

	if (error) {
		redirect("/profile?error=leave_failed");
	}

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
