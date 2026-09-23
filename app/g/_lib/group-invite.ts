import "server-only";

import { createHash } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { siteUrl } from "@/lib/site-url";

export const GROUP_INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type GroupInviteClaims = {
	inviteId: string;
	groupId: string;
};

function groupInviteSecret() {
	const raw = process.env.INVITE_JWT_SECRET;
	if (!raw) throw new Error("INVITE_JWT_SECRET is not set");
	return new TextEncoder().encode(raw);
}

/** Hash del token para guardar y revocar sin almacenar el token (ADR-0011). */
export function hashGroupInviteToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

/** Firma el enlace de invitación al grupo: expira en 30 días. */
export async function signGroupInviteToken(
	claims: GroupInviteClaims,
): Promise<string> {
	const nowSec = Math.floor(Date.now() / 1000);
	return new SignJWT({ gid: claims.groupId })
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setSubject(claims.groupId)
		.setJti(claims.inviteId)
		.setIssuedAt(nowSec)
		.setExpirationTime(nowSec + Math.floor(GROUP_INVITE_TTL_MS / 1000))
		.sign(groupInviteSecret());
}

/** Verifica firma y caducidad; null si el enlace no vale. */
export async function verifyGroupInviteToken(
	token: string,
): Promise<GroupInviteClaims | null> {
	try {
		const { payload } = await jwtVerify(token, groupInviteSecret());
		const inviteId = typeof payload.jti === "string" ? payload.jti : null;
		const groupId = typeof payload.sub === "string" ? payload.sub : null;
		if (!inviteId || !groupId) return null;
		return { inviteId, groupId };
	} catch {
		return null;
	}
}

/** URL compartible de canje (válida por cualquier canal). */
export function groupInviteUrl(token: string): string {
	return `${siteUrl()}/g/unirse?token=${encodeURIComponent(token)}`;
}
