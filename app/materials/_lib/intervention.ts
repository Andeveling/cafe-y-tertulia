/**
 * Intervención y reloj compartido del Escenario (ADR 0002).
 *
 * El ciclo de una Intervención — oculta → exposición → Complemento →
 * completa — avanza siempre a mano: la app gira solo cuando el Moderador
 * pulsa continuar. El temporizador orienta el ritmo pero nunca corta ni
 * fuerza transiciones. Todos los dispositivos derivan el tiempo del mismo
 * ancla (`phaseStartedAt`), así Moderador y Participantes comparten un solo
 * reloj del Escenario, sin offsets locales.
 *
 * El display — texto, overtime, caption, porcentaje — vive aquí, no en el
 * Escenario. El tick / asOf es `sharedNow`.
 */

import type { AssignmentState } from "./room-types";

/** Orden del ciclo de la Intervención. */
export const INTERVENTION_ORDER: readonly AssignmentState[] = [
	"hidden",
	"exposition",
	"complement",
	"complete",
];

export const PHASE_LABELS: Record<AssignmentState, string> = {
	hidden: "Oculta",
	exposition: "Exposición",
	complement: "Complemento",
	complete: "Completa",
};

/** Segundos sugeridos por fase (orientativo, nunca corta). */
export const SUGGESTED_SECONDS: Partial<Record<AssignmentState, number>> = {
	exposition: 300,
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
		case "exposition":
			return "Terminar exposición";
		case "complement":
			return "Terminar complemento";
		default:
			return "Siguiente";
	}
}

/** Nombre corto de fase para la línea única de progreso. */
export const PHASE_SHORT_LABELS: Record<AssignmentState, string> = {
	hidden: "Oculta",
	exposition: "Exposición",
	complement: "Complemento",
	complete: "Completa",
};

/** Línea única: Intervención X de Y · Fase. */
export function interventionProgressLine(
	current: number,
	total: number,
	state?: AssignmentState,
): string {
	const base = `Intervención ${current} de ${total}`;
	if (!state || state === "hidden") return base;
	return `${base} · ${PHASE_SHORT_LABELS[state]}`;
}

/** Etiqueta del reloj: fase + presupuesto sugerido. */
export function phaseClockLabel(state: AssignmentState): string {
	const suggested = SUGGESTED_SECONDS[state];
	if (suggested == null) return PHASE_SHORT_LABELS[state];
	return `${PHASE_SHORT_LABELS[state]} · sugerido ${formatClock(suggested)}`;
}

/** Sublínea del reloj. A 0 deja claro que no corta. */
export function phaseClockCaption(remaining: number): string {
	return remaining === 0
		? "Tiempo sugerido cumplido · no corta, el moderador avanza cuando quiera"
		: "No corta, el moderador avanza";
}

/** Segundos pasados del sugerido (overtime): 0 mientras queda presupuesto. */
export function overtimeSeconds(
	elapsed: number,
	suggestedSeconds: number,
): number {
	const budget = Number.isFinite(suggestedSeconds)
		? Math.max(0, Math.floor(suggestedSeconds))
		: 0;
	return Math.max(0, Math.floor(elapsed) - budget);
}

/** Lo que esta Intervención muestra ahora. */
export type InterventionDisplay = {
	text: string;
	overtime: boolean;
	caption: string;
	pct: number;
};

/**
 * Reloj de la Intervención: Exposición cuenta atrás y luego overtime;
 * Complemento cuenta arriba, sin overtime. Nunca corta (ADR 0002).
 */
export function interventionDisplay(
	state: AssignmentState,
	phaseStartedAt: string,
	now: number,
): InterventionDisplay {
	const startedAtMs = Date.parse(phaseStartedAt);
	const suggested = SUGGESTED_SECONDS[state] ?? 0;
	const elapsed = elapsedSeconds(startedAtMs, now);
	const pct = Math.min(
		100,
		Math.round((elapsed / Math.max(1, suggested)) * 100),
	);
	if (state === "complement") {
		return {
			text: formatClock(elapsed),
			overtime: false,
			caption: "Tiempo transcurrido · el moderador cierra cuando quiera",
			pct,
		};
	}
	if (state !== "exposition") {
		return {
			text: "0:00",
			overtime: false,
			caption: "No corta, el moderador avanza",
			pct: 0,
		};
	}
	const remaining = remainingSeconds(startedAtMs, suggested, now);
	const extra = overtimeSeconds(elapsed, suggested);
	if (extra > 0) {
		return {
			text: `+${formatClock(extra)}`,
			overtime: true,
			caption: "Pasado el sugerido · no corta, el moderador decide",
			pct: 100,
		};
	}
	return {
		text: formatClock(remaining),
		overtime: false,
		caption: phaseClockCaption(remaining),
		pct,
	};
}
