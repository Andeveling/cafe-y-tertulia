import type { MaterialKind } from "./constants";
import {
	type NominationCandidate as BaseNominationCandidate,
	canNominate,
	type NominationCheck,
	type NominationStatus,
} from "./postulacion";

export type { NominationCheck, NominationStatus };
export { canNominate };

export type MaterialDrawOrigin = "draw" | "pact";

/** Candidata del sorteo: la regla 1×formato más su identidad para la urna. */
export type NominationCandidate = BaseNominationCandidate & {
	id: string;
};

/**
 * Sorteo de Material intra-formato (#89, PRD #86).
 *
 * Módulo puro sin E/S: la urna compite solo intra-formato (nunca libro vs
 * podcast), mínimo 2 postulados del formato declarado, tope 1 por presente,
 * ausentes/espectadores fuera (el caller pasa los presentes), bloqueo al
 * abrir (la urna se congela en candidate_ids) y perdedores que siguen
 * activos. La regla 1×formato vive en `./postulacion` (única fuente);
 * la persistencia (índice parcial + RPC atómico resolve) la replica
 * en la base como defensa en profundidad.
 */

/** Urna del formato declarado: solo activas de ese formato, solo presentes,
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
