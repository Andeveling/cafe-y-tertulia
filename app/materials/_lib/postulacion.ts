import type { MaterialKind } from "./constants";

export type NominationStatus = "active" | "withdrawn" | "won";

export type NominationCandidate = {
	kind: MaterialKind;
	status: string;
	proposedBy: string;
};

export type NominationCheck = { ok: true } | { ok: false; error: string };

/**
 * Postulación 1×formato (#88, PRD #86).
 *
 * Módulo puro sin E/S: la regla vive aquí para probar comportamiento
 * externo sin SQL. La persistencia (índice parcial + RPCs atómicos)
 * replica esta regla en la base como defensa en profundidad.
 */

/** Máximo 1 postulación activa por formato, por Miembro y Grupo. */
export function canNominate(
	active: NominationCandidate[],
	kind: MaterialKind,
	proposedBy: string,
): NominationCheck {
	const clash = active.some(
		(n) =>
			n.status === "active" && n.kind === kind && n.proposedBy === proposedBy,
	);
	if (clash) {
		return {
			ok: false,
			error: "Ya tienes una postulación activa en este formato.",
		};
	}
	return { ok: true };
}
