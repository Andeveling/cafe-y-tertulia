import { describe, expect, it } from "vitest";
import {
	formatClock,
	remainingSeconds,
} from "@/app/materials/_lib/intervention";
import { sharedNow } from "@/app/materials/_lib/shared-now";

const T0 = Date.parse("2026-08-25T16:00:00.000Z");

describe("sharedNow — reloj de pared de la Sala", () => {
	it("en hidratación usa asOf del snapshot, no un Date.now() 1s más tarde", () => {
		const asOf = T0 + 202_000;
		const hydrateLater = asOf + 1_000;

		expect(formatClock(remainingSeconds(T0, 300, asOf))).toBe("1:38");
		expect(formatClock(remainingSeconds(T0, 300, hydrateLater))).toBe("1:37");

		const hydrated = sharedNow({ wallNow: null, asOf, fallback: T0 });
		expect(hydrated).toBe(asOf);
		expect(formatClock(remainingSeconds(T0, 300, hydrated))).toBe("1:38");
	});

	it("después de montar, todos los participantes comparten el mismo wallNow", () => {
		const wall = T0 + 203_000;
		const asOfEarly = T0 + 150_000;
		const asOfLate = T0 + 202_000;

		const remainingA = remainingSeconds(
			T0,
			300,
			sharedNow({ wallNow: wall, asOf: asOfEarly }),
		);
		const remainingB = remainingSeconds(
			T0,
			300,
			sharedNow({ wallNow: wall, asOf: asOfLate }),
		);
		expect(remainingA).toBe(remainingB);
		expect(formatClock(remainingA)).toBe("1:37");
	});

	it("frozen gana — stories / tests no tictaquean", () => {
		expect(
			sharedNow({
				frozen: T0 + 10,
				wallNow: T0 + 9_000,
				asOf: T0 + 5_000,
				fallback: T0,
			}),
		).toBe(T0 + 10);
	});
});
