import { describe, expect, it } from "vitest";
import {
	assembleDrawCeremony,
	clampOptimisticPhase,
	DRAW_BEAT_MS,
	DRAW_COUNTDOWN_MS,
	DRAW_FANFARE_MS,
	DRAW_SPIN_MS,
	DRAW_STAGGER_MS,
	DRAW_WHEEL_TURNS,
	drawCeremonyPhase,
	drawWheelRotationDeg,
} from "@/app/materials/_lib/draw-ceremony";
import type {
	RoomAssignment,
	RoomParticipant,
} from "@/app/materials/_lib/room-types";

const T0 = Date.parse("2026-09-07T15:00:00.000Z");
const createdAt = "2026-09-07T15:00:00.000Z";

const ana: RoomParticipant = {
	memberId: "u-ana",
	displayName: "Ana",
	role: "member",
	optOut: false,
};
const andres: RoomParticipant = {
	memberId: "u-andres",
	displayName: "Andrés",
	role: "member",
	optOut: false,
};

const pendingDraw = { done: false, status: null, createdAt: null } as const;

describe("assembleDrawCeremony", () => {
	it("arranca el 3-2-1 con el created_at optimista, sin snapshot autoritativo", () => {
		const ceremony = assembleDrawCeremony(
			{
				draw: pendingDraw,
				assignments: [],
				participants: [ana, andres],
			},
			{ nowMs: T0 + 10, optimisticCreatedAt: createdAt },
		);

		expect(ceremony.started).toBe(true);
		expect(ceremony.createdAt).toBe(createdAt);
		expect(ceremony.phase).toEqual({ kind: "countdown", count: 3 });
	});

	it("congela reveal/settled en fanfarria hasta que existan Asignaciones", () => {
		const settledAt =
			T0 + DRAW_COUNTDOWN_MS + DRAW_FANFARE_MS + DRAW_STAGGER_MS * 4;
		const ceremony = assembleDrawCeremony(
			{
				draw: pendingDraw,
				assignments: [],
				participants: [ana, andres],
			},
			{ nowMs: settledAt, optimisticCreatedAt: createdAt },
		);

		expect(ceremony.phase).toEqual({ kind: "fanfare" });
		expect(ceremony.assignments).toEqual([]);
	});

	it("deja fuera del ciclo a Espectador y a quien se sacó", () => {
		const spectator: RoomParticipant = {
			memberId: "u-mia",
			displayName: "Mia",
			role: "spectator",
			optOut: false,
		};
		const optOut: RoomParticipant = {
			memberId: "u-luis",
			displayName: "Luis",
			role: "member",
			optOut: true,
		};
		const ceremony = assembleDrawCeremony(
			{
				draw: pendingDraw,
				assignments: [],
				participants: [ana, spectator, optOut, andres],
			},
			{ nowMs: T0 + 10, optimisticCreatedAt: createdAt },
		);

		expect(ceremony.people).toEqual([
			{ id: "u-ana", name: "Ana" },
			{ id: "u-andres", name: "Andrés" },
		]);
	});

	it("con Asignaciones, reveal y settled siguen el reloj autoritativo", () => {
		const pairs: RoomAssignment[] = [
			{
				assignmentId: "a1",
				questionId: "q1",
				authorId: "u-ana",
				assigneeId: "u-andres",
				authorName: "Ana",
				assigneeName: "Andrés",
				state: "hidden",
				revealOrder: 1,
				questionText: null,
				questionVisible: false,
			},
			{
				assignmentId: "a2",
				questionId: "q2",
				authorId: "u-andres",
				assigneeId: "u-ana",
				authorName: "Andrés",
				assigneeName: "Ana",
				state: "hidden",
				revealOrder: 2,
				questionText: null,
				questionVisible: false,
			},
		];
		const settledAt =
			T0 + DRAW_COUNTDOWN_MS + DRAW_FANFARE_MS + DRAW_STAGGER_MS * 4;
		const ceremony = assembleDrawCeremony(
			{
				draw: { done: true, status: "hidden", createdAt },
				assignments: pairs,
				participants: [ana, andres],
			},
			{ nowMs: settledAt },
		);

		expect(ceremony.started).toBe(true);
		expect(ceremony.phase).toEqual({ kind: "settled" });
	});

	it("sin Sorteo ni reloj, espera — no habla de fase", () => {
		const ceremony = assembleDrawCeremony(
			{
				draw: pendingDraw,
				assignments: [],
				participants: [ana, andres],
			},
			{ nowMs: T0 },
		);

		expect(ceremony.started).toBe(false);
		expect(ceremony.phase).toBeNull();
		expect(ceremony.createdAt).toBeNull();
	});
});

describe("drawCeremonyPhase", () => {
	it("counts 3-2-1 from created_at so every client shares the clock", () => {
		expect(drawCeremonyPhase(createdAt, T0 + 10, 2).kind).toBe("countdown");
		expect(drawCeremonyPhase(createdAt, T0 + 10, 2)).toMatchObject({
			count: 3,
		});
		expect(drawCeremonyPhase(createdAt, T0 + DRAW_BEAT_MS, 2)).toMatchObject({
			count: 2,
		});
		expect(
			drawCeremonyPhase(createdAt, T0 + DRAW_BEAT_MS * 2, 2),
		).toMatchObject({ count: 1 });
	});

	it("plays fanfare then staggers the pairs", () => {
		expect(
			drawCeremonyPhase(createdAt, T0 + DRAW_COUNTDOWN_MS + 10, 4),
		).toEqual({ kind: "fanfare" });
		const revealAt = T0 + DRAW_COUNTDOWN_MS + DRAW_FANFARE_MS + DRAW_STAGGER_MS;
		expect(drawCeremonyPhase(createdAt, revealAt, 4)).toEqual({
			kind: "reveal",
			revealedCount: 2,
		});
	});

	it("settles after the last pair, on missing clock, or reduced motion", () => {
		const done = T0 + DRAW_COUNTDOWN_MS + DRAW_FANFARE_MS + DRAW_STAGGER_MS * 4;
		expect(drawCeremonyPhase(createdAt, done, 4)).toEqual({
			kind: "settled",
		});
		expect(drawCeremonyPhase(null, T0, 4)).toEqual({ kind: "settled" });
		expect(drawCeremonyPhase(createdAt, T0, 4, true)).toEqual({
			kind: "settled",
		});
	});
});

describe("clampOptimisticPhase", () => {
	it("congela en fanfarria el reveal/settled sin snapshot autoritativo", () => {
		expect(
			clampOptimisticPhase({ kind: "reveal", revealedCount: 1 }, true),
		).toEqual({ kind: "fanfare" });
		expect(clampOptimisticPhase({ kind: "settled" }, true)).toEqual({
			kind: "fanfare",
		});
	});

	it("deja pasar countdown y fanfarria optimistas", () => {
		expect(clampOptimisticPhase({ kind: "countdown", count: 2 }, true)).toEqual(
			{ kind: "countdown", count: 2 },
		);
		expect(clampOptimisticPhase({ kind: "fanfare" }, true)).toEqual({
			kind: "fanfare",
		});
	});

	it("no toca nada cuando el snapshot ya llegó", () => {
		const reveal = { kind: "reveal", revealedCount: 2 } as const;
		expect(clampOptimisticPhase(reveal, false)).toBe(reveal);
		expect(clampOptimisticPhase({ kind: "settled" }, false)).toEqual({
			kind: "settled",
		});
	});
});

describe("drawWheelRotationDeg", () => {
	it("arranca en 0 y termina en 8 vueltas", () => {
		expect(drawWheelRotationDeg(0)).toBe(0);
		expect(drawWheelRotationDeg(DRAW_SPIN_MS)).toBe(360 * DRAW_WHEEL_TURNS);
		expect(drawWheelRotationDeg(DRAW_SPIN_MS * 2)).toBe(360 * DRAW_WHEEL_TURNS);
	});

	it("no es lineal — más giro al inicio", () => {
		const mid = drawWheelRotationDeg(DRAW_SPIN_MS / 2);
		expect(mid).toBeGreaterThan((360 * DRAW_WHEEL_TURNS) / 2);
	});
});
