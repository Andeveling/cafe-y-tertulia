import "server-only";

import { findUserByEmail } from "@/app/invite/_lib/invite";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClaimResult =
	| { ok: true }
	| { ok: false; code: "no_invite" | "failed" };
/**
 * Activa una Invitación pendiente con email + contraseña, sin el enlace
 * del correo (que GoTrue arma con Site URL y a veces queda en localhost).
 */
export async function claimInvitation(input: {
	email: string;
	password: string;
	displayName: string;
}): Promise<ClaimResult> {
	const email = input.email.trim().toLowerCase();
	const admin = createAdminClient();

	const { data: invitation } = await admin
		.from("invitations")
		.select("id, expires_at, invited_by")
		.eq("email", email)
		.eq("status", "pending")
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (!invitation || new Date(invitation.expires_at).getTime() <= Date.now()) {
		return { ok: false, code: "no_invite" };
	}

	const { user: existing } = await findUserByEmail(admin, email);

	let userId = existing?.id;
	if (userId) {
		const { error } = await admin.auth.admin.updateUserById(userId, {
			password: input.password,
			email_confirm: true,
			user_metadata: { display_name: input.displayName },
		});
		if (error) return { ok: false, code: "failed" };
	} else {
		const { data, error } = await admin.auth.admin.createUser({
			email,
			password: input.password,
			email_confirm: true,
			user_metadata: { display_name: input.displayName },
		});
		if (error || !data.user) return { ok: false, code: "failed" };
		userId = data.user.id;
	}

	const { error: memberError } = await admin.from("members").upsert(
		{
			id: userId,
			status: "active",
			display_name: input.displayName,
			invited_by: invitation.invited_by,
		},
		{ onConflict: "id" },
	);
	if (memberError) return { ok: false, code: "failed" };

	const { error: inviteError } = await admin
		.from("invitations")
		.update({ status: "accepted" })
		.eq("id", invitation.id);
	if (inviteError) return { ok: false, code: "failed" };

	return { ok: true };
}
