import { describe, expect, it } from "vitest";
import { elapsedSeconds } from "@/app/materials/_lib/intervention";

describe("elapsedSeconds", () => {
	it("el mismo startedAt da el mismo tiempo aunque el cliente monte tarde", () => {
		const started = Date.parse("2026-08-25T16:00:00.000Z");
		const nowA = started + 45_000;
		const nowB = started + 45_000;
		expect(elapsedSeconds(started, nowA)).toBe(45);
		expect(elapsedSeconds(started, nowB)).toBe(45);
	});

	it("quien entra 20s tarde ve 20, no 0", () => {
		const started = Date.parse("2026-08-25T16:00:00.000Z");
		const lateJoin = started + 20_000;
		expect(elapsedSeconds(started, lateJoin)).toBe(20);
	});

	it("nunca es negativo", () => {
		const started = Date.parse("2026-08-25T16:00:10.000Z");
		const now = started - 5_000;
		expect(elapsedSeconds(started, now)).toBe(0);
	});
});
