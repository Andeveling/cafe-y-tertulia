import type {
	RoomAssignment,
	RoomDraw,
	RoomParticipant,
} from "@/app/materials/_lib/room-types";

/**
 * Reloj compartido del Sorteo. Todos los dispositivos derivan la fase
 * de `draws.created_at` — no del momento en que les llegó el evento —
 * para que el ciclo gire igual en realtime.
 *
 * La ceremonia asamblea el reloj (optimista vs autoritativo), quién entra
 * al ciclo y el freeze de parejas. La Sala pasa el slice + Sortear.
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

/** Slice de Sala que la ceremonia necesita — no flags de reloj. */
export type DrawCeremonySlice = {
	draw: RoomDraw;
	assignments: RoomAssignment[];
	participants: RoomParticipant[];
};

export type DrawCeremonyPerson = { id: string; name: string };

export type DrawCeremonyAssembly = {
	started: boolean;
	createdAt: string | null;
	phase: DrawCeremonyPhase | null;
	people: DrawCeremonyPerson[];
	assignments: RoomAssignment[];
	/** Para el tick: ≥1 si el Sorteo ya arrancó y aún no hay parejas. */
	pairCount: number;
};

/**
 * Asamblea del Sorteo: el 3-2-1 arranca con el created_at del evento;
 * reveal/settled esperan las Asignaciones.
 */
export function assembleDrawCeremony(
	slice: DrawCeremonySlice,
	opts: {
		nowMs: number;
		optimisticCreatedAt?: string | null;
		reducedMotion?: boolean;
	},
): DrawCeremonyAssembly {
	const createdAt = slice.draw.createdAt ?? opts.optimisticCreatedAt ?? null;
	const started = slice.draw.done || createdAt !== null;
	const awaitingPairs = started && slice.assignments.length === 0;
	const pairCount = awaitingPairs ? 1 : slice.assignments.length;
	const people = slice.participants
		.filter((p) => p.role !== "spectator" && !p.optOut)
		.map((p) => ({ id: p.memberId, name: p.displayName }));
	return {
		started,
		createdAt,
		phase: started
			? clampOptimisticPhase(
					drawCeremonyPhase(
						createdAt,
						opts.nowMs,
						pairCount,
						opts.reducedMotion ?? false,
					),
					awaitingPairs,
				)
			: null,
		people,
		assignments: slice.assignments,
		pairCount,
	};
}

/** Giro del ciclo: 8 vueltas con ease-out, anclado al reloj compartido. */
export function drawWheelRotationDeg(elapsedMs: number): number {
	const t = Math.min(1, Math.max(0, elapsedMs / DRAW_SPIN_MS));
	const eased = 1 - (1 - t) ** 3;
	return eased * 360 * DRAW_WHEEL_TURNS;
}
