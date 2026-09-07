import { describe, expect, it } from "vitest";
import {
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
