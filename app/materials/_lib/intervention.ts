/**
 * Máquina de fases de una Intervención (SPEC §3.3 · ADR 0002).
 * El temporizador es UI; aquí solo el avance de estado.
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

/**
 * Siguiente estado al pulsar "Continuar".
 * Complemento solo si el autor está presente y no queda otra
 * Asignación incompleta de la misma Pregunta (último exponente).
 */
export function nextAssignmentState(input: {
	current: AssignmentState;
	authorPresent: boolean;
	isLastForQuestion: boolean;
}): AssignmentState | null {
	switch (input.current) {
		case "preparation":
			return "exposition";
		case "exposition":
			if (input.authorPresent && input.isLastForQuestion) {
				return "complement";
			}
			return "complete";
		case "complement":
			return "complete";
		default:
			return null;
	}
}
