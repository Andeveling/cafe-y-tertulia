export type PactMode = "room" | "async";

export type PactStatus = "pending" | "agreed" | "expired" | "cancelled";

/** Ventana fija de 7 días para el pacto asíncrono (#90, historia 20). */
export const PACT_WINDOW_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Pacto sobre un postulado existente (#90, PRD #86).
 *
 * Módulo puro sin E/S: el pacto en Sala lo declara el Moderador (inmediato)
 * y el asíncrono lo propone cualquiera con ventana de 7 días y mayoría
 * simple. Acordar cancela los otros pendientes (un solo camino de elección)
 * y reusa la resolución del sorteo (clon a seleccionado + Sesión, origen
 * `pact` en el Histórico). Sin quórum al día 7 cae a sorteo automático.
 */

/** Mayoría simple: mitad + 1 (1 de 1, 2 de 3, 3 de 5). */
export function quorumNeeded(memberCount: number): number {
	if (memberCount <= 0) return 1;
	return Math.floor(memberCount / 2) + 1;
}

/** ¿Hay acuerdo explícito dentro de la ventana? */
export function hasQuorum(approvalCount: number, memberCount: number): boolean {
	return approvalCount >= quorumNeeded(memberCount);
}

/** Vencimiento = creado + 7 días (fijo por Grupo en el futuro). */
export function pactExpiresAt(createdAt: Date): Date {
	return new Date(createdAt.getTime() + PACT_WINDOW_DAYS * MS_PER_DAY);
}

/** Expirado al llegar al día 7 (>=, sin prórroga). */
export function isPactExpired(expiresAt: Date, now: Date): boolean {
	return now.getTime() >= expiresAt.getTime();
}

/** ¿Se puede aprobar? Pendiente, vigente y sin voto previo. */
export function canApprovePact(
	status: PactStatus,
	expiresAt: Date,
	now: Date,
	alreadyApproved: boolean,
): boolean {
	if (status !== "pending") return false;
	if (alreadyApproved) return false;
	return !isPactExpired(expiresAt, now);
}

/**
 * Fallback a sorteo: solo pendiente + expirado + sin quórum.
 * El caller sortea entre lo postulado (perdedores siguen activos).
 */
export function needsFallbackToDraw(
	status: PactStatus,
	approvalCount: number,
	memberCount: number,
	expiresAt: Date,
	now: Date,
): boolean {
	if (status !== "pending") return false;
	if (!isPactExpired(expiresAt, now)) return false;
	return !hasQuorum(approvalCount, memberCount);
}

export type PactReference = { id: string; status: PactStatus };

/**
 * Un solo camino de elección: al acordar un pacto se cancelan los otros
 * pendientes del Grupo (el sorteo pendiente cae con ellos).
 */
export function cancelOtherPendingPacts(
	pacts: PactReference[],
	winnerPactId: string,
): string[] {
	return pacts
		.filter((pact) => pact.id !== winnerPactId && pact.status === "pending")
		.map((pact) => pact.id);
}
