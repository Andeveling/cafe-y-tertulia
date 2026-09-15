import "server-only";

import {
	createHash,
	randomBytes,
	randomUUID,
	timingSafeEqual,
} from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { errors, jwtVerify, SignJWT } from "jose";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteResult =
	| { ok: true; url: string }
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

export type AcceptInviteResult =
	| { ok: true }
	| { ok: false; code: "expired" | "invalid" | "failed" };

export type PeekInviteResult =
	| { ok: true; email: string }
	| { ok: false; code: "expired" | "invalid" };

export type RevokeResult =
	| { ok: true }
	| { ok: false; code: "not_found" | "not_pending" };

type InvitationClaims = {
	id: string;
	email: string;
	created_at: string;
	expires_at: string;
};

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function inviteSecret() {
	const raw = process.env.INVITE_JWT_SECRET;
	if (!raw) {
		throw new Error("INVITE_JWT_SECRET is not set");
	}
	return new TextEncoder().encode(raw);
}

function hashToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

function hashesMatch(stored: string | null, token: string) {
	if (!stored) return false;
	const a = Buffer.from(stored);
	const b = Buffer.from(hashToken(token));
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

async function signInviteToken(invitation: InvitationClaims) {
	const issuedAt = Math.floor(Date.parse(invitation.created_at) / 1000);
	const expiresAt = Math.floor(Date.parse(invitation.expires_at) / 1000);
	return new SignJWT({ email: invitation.email })
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setSubject(invitation.email)
		.setJti(invitation.id)
		.setIssuedAt(issuedAt)
		.setExpirationTime(expiresAt)
		.sign(inviteSecret());
}

function inviteUrl(token: string) {
	return `${siteUrl()}/auth/invite?token=${encodeURIComponent(token)}`;
}

export async function inviteLinkFor(
	invitation: InvitationClaims,
): Promise<string> {
	const token = await signInviteToken(invitation);
	return inviteUrl(token);
}

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
		if (data.nextPage === null || page >= data.nextPage) {
			return { user: null };
		}
	}
}

/**
 * Crea una Invitación con enlace compartible (ADR 0011).
 * El padrino debe ser Miembro activo. No envía correo.
 */
export async function createInviteLink(input: {
	email: string;
	padrinoId: string;
}): Promise<InviteResult> {
	const email = input.email.trim().toLowerCase();

	if (!isValidEmail(email)) {
		return { ok: false, code: "invalid_email" };
	}

	const admin = createAdminClient();

	const { data: padrino } = await admin
		.from("members")
		.select("id, status")
		.eq("id", input.padrinoId)
		.single();

	if (!padrino || padrino.status !== "active") {
		return { ok: false, code: "not_active_member" };
	}

	const { user: existingUser } = await findUserByEmail(admin, email);

	if (existingUser) {
		const { data: existingMember } = await admin
			.from("members")
			.select("id, status")
			.eq("id", existingUser.id)
			.maybeSingle();

		if (existingMember && existingMember.status !== "invited") {
			return {
				ok: false,
				code:
					existingMember.status === "left" ? "left_member" : "already_member",
			};
		}
	}

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
		return { ok: false, code: "already_invited_pending" };
	}

	if (pendingInvite && pendingInvite.status === "pending") {
		const { error: expireError } = await admin
			.from("invitations")
			.update({ status: "expired" })
			.eq("id", pendingInvite.id);
		if (expireError) {
			return { ok: false, code: "send_failed" };
		}
	}

	let userId = existingUser?.id;
	if (!userId) {
		const { data: created, error: createError } =
			await admin.auth.admin.createUser({
				email,
				password: randomBytes(32).toString("base64url"),
				email_confirm: true,
			});
		if (createError || !created.user) {
			return { ok: false, code: "send_failed" };
		}
		userId = created.user.id;
	}

	const { error: memberError } = await admin.from("members").upsert(
		{
			id: userId,
			status: "invited",
			invited_by: input.padrinoId,
		},
		{ onConflict: "id", ignoreDuplicates: true },
	);
	if (memberError) {
		return { ok: false, code: "send_failed" };
	}

	const issuedAtSec = Math.floor(Date.now() / 1000);
	const invitation: InvitationClaims = {
		id: randomUUID(),
		email,
		created_at: new Date(issuedAtSec * 1000).toISOString(),
		expires_at: new Date(issuedAtSec * 1000 + INVITATION_TTL_MS).toISOString(),
	};
	const token = await signInviteToken(invitation);

	const { error: invitationError } = await admin.from("invitations").insert({
		id: invitation.id,
		email,
		invited_by: input.padrinoId,
		status: "pending",
		expires_at: invitation.expires_at,
		created_at: invitation.created_at,
		token_hash: hashToken(token),
	});

	if (invitationError) {
		return { ok: false, code: "send_failed" };
	}

	return { ok: true, url: inviteUrl(token) };
}

/** El padrino cierra una Invitación pendiente. El enlace deja de valer. */
export async function revokeInvitation(input: {
	invitationId: string;
	padrinoId: string;
}): Promise<RevokeResult> {
	const admin = createAdminClient();
	const { data } = await admin
		.from("invitations")
		.select("id, status, invited_by")
		.eq("id", input.invitationId)
		.maybeSingle();

	if (!data || data.invited_by !== input.padrinoId) {
		return { ok: false, code: "not_found" };
	}
	if (data.status !== "pending") {
		return { ok: false, code: "not_pending" };
	}

	const { error } = await admin
		.from("invitations")
		.update({ status: "expired" })
		.eq("id", input.invitationId);

	if (error) return { ok: false, code: "not_found" };
	return { ok: true };
}

/** Cierra la pendiente y emite un enlace nuevo. */
export async function resendInviteLink(input: {
	invitationId: string;
	padrinoId: string;
}): Promise<InviteResult | { ok: false; code: "not_found" | "not_pending" }> {
	const admin = createAdminClient();
	const { data } = await admin
		.from("invitations")
		.select("id, email, status, invited_by")
		.eq("id", input.invitationId)
		.maybeSingle();

	if (!data || data.invited_by !== input.padrinoId) {
		return { ok: false, code: "not_found" };
	}
	if (data.status !== "pending") {
		return { ok: false, code: "not_pending" };
	}

	const { error } = await admin
		.from("invitations")
		.update({ status: "expired" })
		.eq("id", input.invitationId);
	if (error) {
		return { ok: false, code: "send_failed" };
	}

	return createInviteLink({
		email: data.email,
		padrinoId: input.padrinoId,
	});
}

async function resolveInviteToken(token: string): Promise<
	| {
			ok: true;
			email: string;
			invitationId: string;
			invitedBy: string;
	  }
	| { ok: false; code: "expired" | "invalid" }
> {
	if (!token) return { ok: false, code: "invalid" };

	let payload: { jti?: string; email?: unknown; sub?: string };
	try {
		const verified = await jwtVerify(token, inviteSecret(), {
			algorithms: ["HS256"],
		});
		payload = verified.payload as typeof payload;
	} catch (error) {
		if (error instanceof errors.JWTExpired) {
			return { ok: false, code: "expired" };
		}
		return { ok: false, code: "invalid" };
	}

	const email =
		typeof payload.email === "string"
			? payload.email
			: (payload.sub ?? "").toLowerCase();
	const invitationId = payload.jti;
	if (!email || !invitationId) {
		return { ok: false, code: "invalid" };
	}

	const admin = createAdminClient();
	const { data: invitation } = await admin
		.from("invitations")
		.select("id, email, status, expires_at, token_hash, invited_by")
		.eq("id", invitationId)
		.maybeSingle();

	if (
		!invitation ||
		invitation.email !== email ||
		!hashesMatch(invitation.token_hash, token)
	) {
		return { ok: false, code: "invalid" };
	}

	if (invitation.status !== "pending") {
		return { ok: false, code: "invalid" };
	}

	if (new Date(invitation.expires_at).getTime() <= Date.now()) {
		return { ok: false, code: "expired" };
	}

	return {
		ok: true,
		email,
		invitationId: invitation.id,
		invitedBy: invitation.invited_by,
	};
}

export async function peekInviteToken(
	token: string,
): Promise<PeekInviteResult> {
	const resolved = await resolveInviteToken(token);
	if (!resolved.ok) return resolved;
	return { ok: true, email: resolved.email };
}

/**
 * Canjea el enlace: fija nombre visible y contraseña, activa la membresía
 * y marca la Invitación aceptada. Un solo uso.
 */
export async function acceptInviteToken(input: {
	token: string;
	email: string;
	displayName: string;
	password: string;
}): Promise<AcceptInviteResult> {
	const email = input.email.trim().toLowerCase();
	const resolved = await resolveInviteToken(input.token);
	if (!resolved.ok) return resolved;
	if (resolved.email !== email) {
		return { ok: false, code: "invalid" };
	}

	const admin = createAdminClient();
	const { user: existing } = await findUserByEmail(admin, resolved.email);

	if (existing) {
		const { data: member } = await admin
			.from("members")
			.select("id, status")
			.eq("id", existing.id)
			.maybeSingle();
		if (member?.status === "left") {
			return { ok: false, code: "invalid" };
		}
		if (member?.status === "active") {
			return { ok: false, code: "invalid" };
		}
	}

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
			email: resolved.email,
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
			invited_by: resolved.invitedBy,
		},
		{ onConflict: "id" },
	);
	if (memberError) return { ok: false, code: "failed" };

	const { error: inviteError } = await admin
		.from("invitations")
		.update({ status: "accepted" })
		.eq("id", resolved.invitationId);
	if (inviteError) return { ok: false, code: "failed" };

	return { ok: true };
}
