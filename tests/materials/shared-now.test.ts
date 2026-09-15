import { describe, expect, it } from "vitest";
import { interventionDisplay } from "@/app/materials/_lib/intervention";
import { sharedNow } from "@/app/materials/_lib/shared-now";

const STARTED_AT = "2026-08-25T16:00:00.000Z";
const T0 = Date.parse(STARTED_AT);

describe("sharedNow — reloj de pared de la Sala", () => {
	it("en hidratación el display usa asOf del snapshot, no un Date.now() 1s más tarde", () => {
		const asOf = T0 + 202_000;
		const hydrateLater = asOf + 1_000;

		const ssr = interventionDisplay(
			"exposition",
			STARTED_AT,
			sharedNow({ wallNow: null, asOf, fallback: T0 }),
		);
		expect(ssr.text).toBe("1:38");

		const skewed = interventionDisplay("exposition", STARTED_AT, hydrateLater);
		expect(skewed.text).toBe("1:37");

		const hydrated = interventionDisplay(
			"exposition",
			STARTED_AT,
			sharedNow({ wallNow: null, asOf, fallback: T0 }),
		);
		expect(hydrated.text).toBe("1:38");
	});

	it("después de montar, Moderador y Participantes ven el mismo m:ss", () => {
		const wall = T0 + 203_000;

		const moderator = interventionDisplay(
			"exposition",
			STARTED_AT,
			sharedNow({ wallNow: wall, asOf: T0 + 150_000 }),
		);
		const participante = interventionDisplay(
			"exposition",
			STARTED_AT,
			sharedNow({ wallNow: wall, asOf: T0 + 202_000 }),
		);
		expect(moderator.text).toBe(participante.text);
		expect(moderator.text).toBe("1:37");
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
