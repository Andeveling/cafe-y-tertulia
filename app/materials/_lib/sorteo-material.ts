import type { MaterialKind } from "./constants";

export type NominationStatus = "active" | "withdrawn" | "won";

export type MaterialDrawOrigin = "draw" | "pact";

export type NominationCandidate = {
	id: string;
	kind: MaterialKind;
	status: NominationStatus;
	proposedBy: string;
};

export type NominationCheck = { ok: true } | { ok: false; error: string };

/**
 * Sorteo de Material intra-formato (#89, PRD #86).
 *
 * Módulo puro sin E/S: la urna compite solo intra-formato (nunca libro vs
 * podcast), mínimo 2 postulados del formato declarado, tope 1 por presente,
 * ausentes/espectadores fuera (el caller pasa los presentes), bloqueo al
 * abrir (la urna se congela en candidate_ids) y perdedores que siguen
 * activos. La persistencia (índice parcial + RPC atómico resolve) replica
 * estas reglas en la base como defensa en profundidad.
 */

/** Máximo 1 postulación activa por formato, por Miembro y Grupo. */
export function canNominate(
	candidates: NominationCandidate[],
	kind: MaterialKind,
	proposedBy: string,
): NominationCheck {
	const hasActiveInKind = candidates.some(
		(candidate) =>
			candidate.status === "active" &&
			candidate.kind === kind &&
			candidate.proposedBy === proposedBy,
	);
	if (hasActiveInKind) {
		return {
			ok: false,
			error: "Ya tienes una postulación activa en este formato.",
		};
	}
	return { ok: true };
}

/**
 * Urna del formato declarado: solo activas de ese formato, solo presentes,
 * tope 1 por presente (la primera por orden de llegada gana el cupo).
 */
export function buildDrawPool(
	candidates: NominationCandidate[],
	declaredKind: MaterialKind,
	presentIds: string[],
): NominationCandidate[] {
	const present = new Set(presentIds);
	const membersAlreadyInPool = new Set<string>();
	const pool: NominationCandidate[] = [];
	for (const candidate of candidates) {
		if (candidate.status !== "active") continue;
		if (candidate.kind !== declaredKind) continue;
		if (!present.has(candidate.proposedBy)) continue;
		if (membersAlreadyInPool.has(candidate.proposedBy)) continue;
		membersAlreadyInPool.add(candidate.proposedBy);
		pool.push(candidate);
	}
	return pool;
}

/** Urna válida: mínimo 2 y toda del formato declarado. */
export function isValidDrawPool(
	pool: NominationCandidate[],
	declaredKind: MaterialKind,
): NominationCheck {
	if (pool.length < 2) {
		return { ok: false, error: "El sorteo necesita al menos 2 postulados." };
	}
	const hasMixedKind = pool.some(
		(candidate) => candidate.kind !== declaredKind,
	);
	if (hasMixedKind) {
		return {
			ok: false,
			error: "Un libro nunca compite contra un podcast en la misma urna.",
		};
	}
	return { ok: true };
}

/** Ganar marca solo la ganadora; las perdedoras siguen activas. */
export function markWinner(
	pool: NominationCandidate[],
	winnerId: string,
): NominationCandidate[] {
	return pool.map((candidate) =>
		candidate.id === winnerId ? { ...candidate, status: "won" } : candidate,
	);
}
