export type InvitationRow = {
	id: string;
	email: string;
	status: "pending" | "accepted" | "expired";
	expires_at: string;
	created_at: string;
};

export type InvitationDisplayStatus =
	| "pending"
	| "accepted"
	| "expired"
	| "revoked";

export function invitationProgress(
	createdAt: string,
	expiresAt: string,
	now = Date.now(),
): { ratio: number; leftMs: number; live: boolean } {
	const start = Date.parse(createdAt);
	const end = Date.parse(expiresAt);
	const total = Math.max(1, end - start);
	const leftMs = Math.max(0, end - now);
	return { leftMs, ratio: leftMs / total, live: leftMs > 0 };
}

export function invitationDisplayStatus(
	invitation: Pick<InvitationRow, "status" | "expires_at">,
	now = Date.now(),
): InvitationDisplayStatus {
	if (invitation.status === "accepted") return "accepted";
	if (invitation.status === "expired") return "revoked";
	if (Date.parse(invitation.expires_at) <= now) return "expired";
	return "pending";
}

export function formatTimeLeft(leftMs: number): string {
	const minutes = Math.ceil(leftMs / 60_000);
	if (minutes >= 60) {
		const hours = Math.floor(minutes / 60);
		const rest = minutes % 60;
		return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
	}
	return minutes <= 1 ? "menos de 1 min" : `${minutes} min`;
}

export const INVITATION_STATUS_LABELS: Record<InvitationDisplayStatus, string> =
	{
		pending: "Pendiente",
		accepted: "Aceptada",
		expired: "Vencida",
		revoked: "Revocada",
	};
