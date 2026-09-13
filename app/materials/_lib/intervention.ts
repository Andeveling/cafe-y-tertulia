/**
 * Intervención y reloj compartido del Escenario (ADR 0002).
 *
 * El ciclo de una Intervención — oculta → Momento de preparación →
 * exposición → Complemento → completa — avanza siempre a mano: la app gira
 * solo cuando el Moderador pulsa continuar. El temporizador orienta el
 * ritmo pero nunca corta ni fuerza transiciones. Todos los dispositivos
 * derivan el tiempo del mismo ancla (`phaseStartedAt`), así Moderador y
 * Participantes comparten un solo reloj del Escenario, sin offsets locales.
 */

export type AssignmentState =
	| "hidden"
	| "preparation"
	| "exposition"
	| "complement"
	| "complete";

/** Orden del ciclo de la Intervención. */
export const INTERVENTION_ORDER: readonly AssignmentState[] = [
	"hidden",
	"preparation",
	"exposition",
	"complement",
	"complete",
];

export const PHASE_LABELS: Record<AssignmentState, string> = {
	hidden: "Oculta",
	preparation: "Momento de preparación",
	exposition: "Exposición",
	complement: "Complemento",
	complete: "Completa",
};

/** Segundos sugeridos por fase (orientativo, nunca corta). */
export const SUGGESTED_SECONDS: Partial<Record<AssignmentState, number>> = {
	preparation: 120,
	exposition: 180,
	complement: 120,
};

/** Segundos transcurridos desde un ancla compartida (ISO o epoch ms). */
export function elapsedSeconds(startedAtMs: number, nowMs: number): number {
	if (!Number.isFinite(startedAtMs) || !Number.isFinite(nowMs)) return 0;
	return Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
}

/**
 * Segundos restantes del presupuesto sugerido según el reloj compartido.
 * Nunca negativo y sin estado local: dos dispositivos con el mismo ancla
 * ven lo mismo.
 */
export function remainingSeconds(
	startedAtMs: number,
	suggestedSeconds: number,
	nowMs: number,
): number {
	const budget = Number.isFinite(suggestedSeconds)
		? Math.max(0, Math.floor(suggestedSeconds))
		: 0;
	return Math.max(0, budget - elapsedSeconds(startedAtMs, nowMs));
}

/** Formato m:ss del reloj del Escenario. */
export function formatClock(totalSeconds: number): string {
	const n = Number.isFinite(totalSeconds)
		? Math.max(0, Math.floor(totalSeconds))
		: 0;
	return `${Math.floor(n / 60)}:${(n % 60).toString().padStart(2, "0")}`;
}

/** Siguiente fase del ciclo, o null si la Intervención ya está completa. */
export function nextInterventionState(
	state: AssignmentState,
): AssignmentState | null {
	const idx = INTERVENTION_ORDER.indexOf(state);
	if (idx < 0 || idx >= INTERVENTION_ORDER.length - 1) return null;
	return INTERVENTION_ORDER[idx + 1];
}

/** Acción de conducción que el Escenario ofrece en cada fase. */
export function interventionNextLabel(state: AssignmentState): string {
	switch (state) {
		case "preparation":
			return "Comenzar exposición";
		case "exposition":
			return "Avanzar intervención";
		case "complement":
			return "Completar intervención";
		default:
			return "Siguiente";
	}
}
