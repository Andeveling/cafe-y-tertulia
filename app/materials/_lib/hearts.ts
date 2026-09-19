/**
 * Corazones por Intervención — puras de elegibilidad y display.
 *
 * Sin efectos colaterales, sin React, testeable aislado.
 * Vocabulario: Corazón (acto individual 1-5) y Aprecio (agregado avg+count).
 */

import type { AssignmentState } from "./room-types";

/**
 * ¿Puede votar este usuario en esta fase?
 * Anti auto-voto: exposición → excluir asignado; complemento → excluir autor.
 * Espectador y Moderador sí votan si están presentes.
 */
export function heartEligibility(opts: {
	phase: AssignmentState;
	userId: string;
	assigneeId: string;
	authorId: string | null;
}): { eligible: boolean; reason?: string } {
	if (opts.phase === "exposition") {
		if (opts.userId === opts.assigneeId) {
			return { eligible: false, reason: "Eres el expositor" };
		}
		return { eligible: true };
	}
	if (opts.phase === "complement") {
		if (opts.authorId && opts.userId === opts.authorId) {
			return { eligible: false, reason: "Eres el autor de la pregunta" };
		}
		return { eligible: true };
	}
	return { eligible: false };
}

/** Texto de progreso: "X de Y". */
export function heartsProgressText(voted: number, eligible: number): string {
	return `${voted} de ${eligible}`;
}

/** Texto del Aprecio revelado: "4.2 (3)" o null si no hay datos. */
export function aprecioDisplayText(
	avg: number | null,
	count: number,
): string | null {
	if (avg === null || count === 0) return null;
	return `${avg.toFixed(1)} (${count})`;
}

/** Estado de la sección de voto de una fase (puro, testeable sin React). */
export type HeartsPhaseState = "vote" | "no-complement" | "solo";

export function heartsPhaseState(opts: {
	phase: AssignmentState;
	authorId: string | null;
	eligibleCount: number;
}): HeartsPhaseState {
	if (opts.phase === "complement" && !opts.authorId) return "no-complement";
	if (opts.eligibleCount <= 0) return "solo";
	return "vote";
}
