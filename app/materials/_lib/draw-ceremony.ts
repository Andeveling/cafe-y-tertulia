/**
 * Reloj compartido del Sorteo. Todos los dispositivos derivan la fase
 * de `draws.created_at` — no del momento en que les llegó el evento —
 * para que el ciclo gire igual en realtime.
 */

export const DRAW_BEAT_MS = 1000;
export const DRAW_COUNTDOWN_MS = DRAW_BEAT_MS * 3;
export const DRAW_FANFARE_MS = 900;
export const DRAW_STAGGER_MS = 80;
export const DRAW_SPIN_MS = DRAW_COUNTDOWN_MS + DRAW_FANFARE_MS;
export const DRAW_WHEEL_TURNS = 8;

export type DrawCeremonyPhase =
	| { kind: "countdown"; count: 3 | 2 | 1 }
	| { kind: "fanfare" }
	| { kind: "reveal"; revealedCount: number }
	| { kind: "settled" };

export function drawCeremonyPhase(
	createdAt: string | null,
	nowMs: number,
	pairCount: number,
	reducedMotion = false,
): DrawCeremonyPhase {
	if (!createdAt || reducedMotion || pairCount <= 0) {
		return { kind: "settled" };
	}
	const t0 = Date.parse(createdAt);
	if (!Number.isFinite(t0)) return { kind: "settled" };

	const elapsed = nowMs - t0;
	if (elapsed < DRAW_BEAT_MS) return { kind: "countdown", count: 3 };
	if (elapsed < DRAW_BEAT_MS * 2) return { kind: "countdown", count: 2 };
	if (elapsed < DRAW_COUNTDOWN_MS) return { kind: "countdown", count: 1 };
	if (elapsed < DRAW_COUNTDOWN_MS + DRAW_FANFARE_MS) {
		return { kind: "fanfare" };
	}

	const revealElapsed = elapsed - DRAW_COUNTDOWN_MS - DRAW_FANFARE_MS;
	const revealedCount = Math.min(
		pairCount,
		Math.floor(revealElapsed / DRAW_STAGGER_MS) + 1,
	);
	if (revealedCount >= pairCount) return { kind: "settled" };
	return { kind: "reveal", revealedCount };
}

/**
 * Reloj optimista del Sorteo: con el `created_at` del evento realtime ya se
 * puede contar 3-2-1 sin esperar al snapshot, pero reveal/settled exigen las
 * asignaciones autoritativas — hasta que lleguen se congela en fanfarria.
 */
export function clampOptimisticPhase(
	phase: DrawCeremonyPhase,
	optimistic: boolean,
): DrawCeremonyPhase {
	if (optimistic && (phase.kind === "reveal" || phase.kind === "settled")) {
		return { kind: "fanfare" };
	}
	return phase;
}

/** Giro del ciclo: 8 vueltas con ease-out, anclado al reloj compartido. */
export function drawWheelRotationDeg(elapsedMs: number): number {
	const t = Math.min(1, Math.max(0, elapsedMs / DRAW_SPIN_MS));
	const eased = 1 - (1 - t) ** 3;
	return eased * 360 * DRAW_WHEEL_TURNS;
}
