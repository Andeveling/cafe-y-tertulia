import { describe, expect, it } from "vitest";
import {
	aggregateMastery,
	masteryLevelFor,
	masteryPoints,
	masteryProgress,
} from "@/app/materials/_lib/mastery";

describe("masteryPoints", () => {
	it("sin participación no hay puntos aunque haya aporte", () => {
		expect(masteryPoints({ participated: false, contributed: true })).toBe(0);
	});

	it("participar suma 1, aportar suma 1 más", () => {
		expect(masteryPoints({ participated: true, contributed: false })).toBe(1);
		expect(masteryPoints({ participated: true, contributed: true })).toBe(2);
	});
});

describe("masteryLevelFor", () => {
	it("respeta los umbrales 3/8/15", () => {
		expect(masteryLevelFor(0)).toBe("Semilla");
		expect(masteryLevelFor(2)).toBe("Semilla");
		expect(masteryLevelFor(3)).toBe("Degustador");
		expect(masteryLevelFor(7)).toBe("Degustador");
		expect(masteryLevelFor(8)).toBe("Contertulio");
		expect(masteryLevelFor(14)).toBe("Contertulio");
		expect(masteryLevelFor(15)).toBe("Maestro");
		expect(masteryLevelFor(99)).toBe("Maestro");
	});
});

describe("masteryProgress", () => {
	it("calcula el siguiente nivel y el porcentaje", () => {
		expect(masteryProgress(1)).toMatchObject({ level: "Semilla", next: 3 });
		expect(masteryProgress(9).pct).toBe(60);
	});

	it("en el tope no hay siguiente y el porcentaje es 100", () => {
		expect(masteryProgress(20)).toMatchObject({
			level: "Maestro",
			next: null,
			pct: 100,
		});
	});
});

describe("aggregateMastery", () => {
	it("suma por categoría e ignora sin participación", () => {
		const points = aggregateMastery([
			{ categoryId: "filo", participated: true, contributed: false },
			{ categoryId: "filo", participated: true, contributed: true },
			{ categoryId: "cine", participated: false, contributed: true },
		]);
		expect(points.get("filo")).toBe(3);
		expect(points.has("cine")).toBe(false);
	});
});
