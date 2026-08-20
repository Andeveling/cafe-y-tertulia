"use server";

import { redirect } from "next/navigation";
import { parseForm } from "@/app/_lib/form-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { acceptInvitationSchema } from "../_schemas/accept-invitation-schema";

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
	const parsed = await parseForm(acceptInvitationSchema, formData);
	if (!parsed.ok) {
		return { error: "invalid" };
	}

	const supabase = await createServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { error: "invalid_or_expired" };
	}

	const { displayName, password } = parsed.data;
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
