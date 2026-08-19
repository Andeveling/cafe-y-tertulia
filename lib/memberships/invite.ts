import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const INVITATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h (SPEC §9)

export type InviteResult =
	| { ok: true }
	| {
			ok: false;
			code:
				| "invalid_email"
				| "not_active_member"
				| "already_member"
				| "left_member"
				| "already_invited_pending"
				| "send_failed";
	  };

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Invite a new person to the club (padrinazgo, ADR 0005).
 *
 * The caller must be the padrino and an active member — enforced here and by
 * RLS. Creates the auth user via inviteUserByEmail (which emails the invite
 * link in Spanish), the members row with status 'invited', and the
 * invitations record with a 24h expiry. A member who left (baja) is not
 * re-invited in the MVP.
 */
export async function inviteMember(input: {
	email: string;
	padrinoId: string;
	padrinoDisplayName: string;
}) {
	const email = input.email.trim().toLowerCase();

	if (!isValidEmail(email)) {
		return { ok: false as const, code: "invalid_email" as const };
	}

	// Service-role client: creates the auth user and the members/invitations
	// rows. Server-only; never shipped to the client.
	const admin = createAdminClient();

	// The padrino must be an active member.
	const { data: padrino } = await admin
		.from("members")
		.select("id, status")
		.eq("id", input.padrinoId)
		.single();

	if (!padrino || padrino.status !== "active") {
		return { ok: false as const, code: "not_active_member" as const };
	}

	// The invited person must not already be a member (of any status) or have
	// a live account: lookup the auth user by email first.
	const { data: userList } = await admin.auth.admin.listUsers({
		page: 1,
		perPage: 200,
	});
	const existingUser = userList?.users.find((u) => u.email === email);

	if (existingUser) {
		const { data: existingMember } = await admin
			.from("members")
			.select("id, status")
			.eq("id", existingUser.id)
			.maybeSingle();

		if (existingMember) {
			// A member who left keeps their contributions and is not invited
			// again (ADR 0005; rejoining is out of MVP scope).
			if (existingMember.status === "left") {
				return { ok: false as const, code: "left_member" as const };
			}
			return { ok: false as const, code: "already_member" as const };
		}

		// The auth user exists (previous invitation) but has no members row
		// yet: allow re-inviting.
	}

	// Re-invite: allow resending to a previously invited-but-never-accepted
	// email whose invitation expired.
	const { data: pendingInvite } = await admin
		.from("invitations")
		.select("id, status, expires_at")
		.eq("email", email)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (
		pendingInvite &&
		pendingInvite.status === "pending" &&
		new Date(pendingInvite.expires_at).getTime() > Date.now()
	) {
		return { ok: false as const, code: "already_invited_pending" as const };
	}

	// Create (or re-send) the auth user with the invite email. The email link
	// redirects to the public /auth/invite page where the guest sets their
	// password and display name.
	const { data: invitedUser, error: inviteError } =
		await admin.auth.admin.inviteUserByEmail(email, {
			data: {
				godfather_display_name: input.padrinoDisplayName,
			},
			redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite`,
		});

	if (inviteError || !invitedUser?.user) {
		return { ok: false as const, code: "send_failed" as const };
	}

	const userId = invitedUser.user.id;

	// members row: 'invited' until first sign-in.
	const { error: memberError } = await admin.from("members").upsert(
		{
			id: userId,
			status: "invited",
			invited_by: input.padrinoId,
		},
		{ onConflict: "id", ignoreDuplicates: true },
	);

	if (memberError) {
		return { ok: false as const, code: "send_failed" as const };
	}

	// invitations record: the padrinazgo.
	const { error: invitationError } = await admin.from("invitations").insert({
		email,
		invited_by: input.padrinoId,
		status: "pending",
		expires_at: new Date(Date.now() + INVITATION_TTL_MS).toISOString(),
	});

	if (invitationError) {
		return { ok: false as const, code: "send_failed" as const };
	}

	return { ok: true as const };
}
