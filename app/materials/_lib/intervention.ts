/**
 * Constantes de UI del Escenario (ADR 0002). La máquina de fases de una
 * Intervención vive en el RPC `advance_intervention` — aquí solo lo que la
 * pantalla necesita para mostrar y cronometrar.
 */

export type AssignmentState =
	| "hidden"
	| "preparation"
	| "exposition"
	| "complement"
	| "complete";

export const PHASE_LABELS: Record<AssignmentState, string> = {
	hidden: "Oculta",
	preparation: "Preparación",
	exposition: "Exposición",
	complement: "Complemento",
	complete: "Completa",
};

/** Segundos sugeridos por fase (orientativo). */
export const SUGGESTED_SECONDS: Partial<Record<AssignmentState, number>> = {
	preparation: 120,
	exposition: 180,
	complement: 120,
};

export const EXTEND_SECONDS = 60;
