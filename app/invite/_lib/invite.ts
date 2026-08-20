import "server-only";

import type { User } from "@supabase/supabase-js";
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
 * Find an auth user by email, paging through the whole user list (listUsers
 * caps at 200 per page; a small club outgrows that fast and the re-invite
 * path must not fail silently).
 */
async function findUserByEmail(
	admin: ReturnType<typeof createAdminClient>,
	email: string,
): Promise<{ user: User | null }> {
	for (let page = 1; ; page++) {
		const { data, error } = await admin.auth.admin.listUsers({
			page,
			perPage: 200,
		});
		if (error || !data) {
			return { user: null };
		}
		const user = data.users.find((u) => u.email === email);
		if (user) {
			return { user };
		}
		// nextPage is the next page number, or null on the last page.
		if (data.nextPage === null || page >= data.nextPage) {
			return { user: null };
		}
	}
}

/**
 * Invite a new person to the club (padrinazgo, ADR 0005).
 *
 * The caller must be the padrino and an active member — enforced here and by
 * RLS. Creates the auth user via inviteUserByEmail (which emails the invite
 * link in Spanish), the members row with status 'invited', and the
 * invitations record with a 24h expiry. Re-inviting a previous invite whose
 * invitation expired re-sends the email (inviteUserByEmail re-emails an
 * existing auth user). A member who left (baja) is not re-invited in the MVP.
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

	// The invited person must not already be an active/left member: lookup the
	// auth user by email first (the invited-but-never-accepted case has one).
	const { user: existingUser } = await findUserByEmail(admin, email);

	if (existingUser) {
		const { data: existingMember } = await admin
			.from("members")
			.select("id, status")
			.eq("id", existingUser.id)
			.maybeSingle();

		if (existingMember) {
			// An invited member with a live pending invitation is handled
			// below; anyone else already has a membership and is not invited
			// again (ADR 0005; rejoining after baja is out of MVP scope).
			if (existingMember.status !== "invited") {
				return {
					ok: false as const,
					code:
						existingMember.status === "left"
							? ("left_member" as const)
							: ("already_member" as const),
				};
			}
		}
	}

	// One live invitation per email (enforced again by the partial unique
	// index): re-inviting is only possible once the previous one expired or
	// was marked as such by the padrino.
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

	// A previous invitation that expired on its own is still 'pending' in the
	// row (only the padrino can mark it expired). Close it so the partial
	// unique index lets the new live invitation through.
	if (pendingInvite && pendingInvite.status === "pending") {
		const { error: expireError } = await admin
			.from("invitations")
			.update({ status: "expired" })
			.eq("id", pendingInvite.id);
		if (expireError) {
			return { ok: false as const, code: "send_failed" as const };
		}
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

	// members row: 'invited' until first sign-in. On a re-invite the row
	// already exists with status 'invited' — leave it (ignoreDuplicates would
	// also ignore the update).
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

	// invitations record: the padrinazgo. The previous pending one expired or
	// was closed, so the new row is the only live invitation for that email
	// (partial unique index).
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
