import { describe, expect, it } from "vitest";
import {
	clampOptimisticPhase,
	DRAW_BEAT_MS,
	DRAW_COUNTDOWN_MS,
	DRAW_FANFARE_MS,
	DRAW_STAGGER_MS,
	drawCeremonyPhase,
} from "@/app/materials/_lib/draw-ceremony";

const T0 = Date.parse("2026-09-07T15:00:00.000Z");
const createdAt = "2026-09-07T15:00:00.000Z";

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
