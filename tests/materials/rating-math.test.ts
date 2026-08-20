import { describe, expect, it } from "vitest";
import {
	materialRatingFromSessions,
	ratingAggregate,
} from "@/app/materials/_lib/rating-math";

describe("ratingAggregate", () => {
	it("promedio 1 decimal + conteo", () => {
		expect(ratingAggregate([5, 4, 4])).toEqual({ avg: 4.3, count: 3 });
		expect(ratingAggregate([1, 2, 3, 4, 5])).toEqual({ avg: 3, count: 5 });
	});

	it("sin votos → null", () => {
		expect(ratingAggregate([])).toEqual({ avg: null, count: 0 });
	});
});

describe("materialRatingFromSessions", () => {
	it("acumula ponderado por conteo de sesión", () => {
		expect(
			materialRatingFromSessions([
				{ avg: 4, count: 2 },
				{ avg: 5, count: 2 },
			]),
		).toEqual({ avg: 4.5, count: 4 });
	});

	it("ignora sesiones sin rating", () => {
		expect(
			materialRatingFromSessions([
				{ avg: null, count: 0 },
				{ avg: 3, count: 1 },
			]),
		).toEqual({ avg: 3, count: 1 });
	});
});
