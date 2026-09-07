/**
 * Reloj compartido del Sorteo. Todos los dispositivos derivan la fase
 * de `draws.created_at` — no del momento en que les llegó el evento —
 * para que el 3-2-1 coincida en realtime.
 */

export const DRAW_BEAT_MS = 1000;
export const DRAW_COUNTDOWN_MS = DRAW_BEAT_MS * 3;
export const DRAW_FANFARE_MS = 900;
export const DRAW_STAGGER_MS = 80;

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
