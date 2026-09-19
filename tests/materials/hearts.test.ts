import { describe, expect, it } from "vitest";
import {
	aprecioDisplayText,
	heartEligibility,
	heartsPhaseState,
	heartsProgressText,
} from "@/app/materials/_lib/hearts";

describe("heartEligibility", () => {
	it("exposición: asignado no puede votar", () => {
		const r = heartEligibility({
			phase: "exposition",
			userId: "assignee-1",
			assigneeId: "assignee-1",
			authorId: "author-1",
		});
		expect(r).toEqual({ eligible: false, reason: "Eres el expositor" });
	});

	it("exposición: autor sí puede votar", () => {
		const r = heartEligibility({
			phase: "exposition",
			userId: "author-1",
			assigneeId: "assignee-1",
			authorId: "author-1",
		});
		expect(r).toEqual({ eligible: true });
	});

	it("exposición: espectador puede votar", () => {
		const r = heartEligibility({
			phase: "exposition",
			userId: "spectator-1",
			assigneeId: "assignee-1",
			authorId: "author-1",
		});
		expect(r).toEqual({ eligible: true });
	});

	it("complemento: autor no puede votar", () => {
		const r = heartEligibility({
			phase: "complement",
			userId: "author-1",
			assigneeId: "assignee-1",
			authorId: "author-1",
		});
		expect(r).toEqual({
			eligible: false,
			reason: "Eres el autor de la pregunta",
		});
	});

	it("complemento: asignado sí puede votar", () => {
		const r = heartEligibility({
			phase: "complement",
			userId: "assignee-1",
			assigneeId: "assignee-1",
			authorId: "author-1",
		});
		expect(r).toEqual({ eligible: true });
	});

	it("complemento: espectador puede votar", () => {
		const r = heartEligibility({
			phase: "complement",
			userId: "spectator-1",
			assigneeId: "assignee-1",
			authorId: "author-1",
		});
		expect(r).toEqual({ eligible: true });
	});

	it("autor null en complemento: todos votan", () => {
		const r = heartEligibility({
			phase: "complement",
			userId: "user-1",
			assigneeId: "assignee-1",
			authorId: null,
		});
		expect(r).toEqual({ eligible: true });
	});

	it("fase desconocida: no elegible", () => {
		const r = heartEligibility({
			phase: "hidden",
			userId: "user-1",
			assigneeId: "assignee-1",
			authorId: "author-1",
		});
		expect(r).toEqual({ eligible: false });
	});
});

describe("heartsPhaseState", () => {
	it("complemento sin autor: no-complement", () => {
		expect(
			heartsPhaseState({
				phase: "complement",
				authorId: null,
				eligibleCount: 3,
			}),
		).toBe("no-complement");
	});

	it("exposición sin autor conocido: vota igual", () => {
		expect(
			heartsPhaseState({
				phase: "exposition",
				authorId: null,
				eligibleCount: 2,
			}),
		).toBe("vote");
	});

	it("sin elegibles: solo", () => {
		expect(
			heartsPhaseState({
				phase: "exposition",
				authorId: "author-1",
				eligibleCount: 0,
			}),
		).toBe("solo");
	});

	it("fase con elegibles: vote", () => {
		expect(
			heartsPhaseState({
				phase: "complement",
				authorId: "author-1",
				eligibleCount: 4,
			}),
		).toBe("vote");
	});
});

describe("heartsProgressText", () => {
	it("0 de 3", () => {
		expect(heartsProgressText(0, 3)).toBe("0 de 3");
	});

	it("2 de 4", () => {
		expect(heartsProgressText(2, 4)).toBe("2 de 4");
	});

	it("3 de 3", () => {
		expect(heartsProgressText(3, 3)).toBe("3 de 3");
	});
});

describe("aprecioDisplayText", () => {
	it("null cuando avg es null", () => {
		expect(aprecioDisplayText(null, 0)).toBeNull();
	});

	it("null cuando count es 0", () => {
		expect(aprecioDisplayText(4.5, 0)).toBeNull();
	});

	it("formatea avg a 1 decimal con count", () => {
		expect(aprecioDisplayText(4.2, 3)).toBe("4.2 (3)");
	});

	it("entero sin decimales muestra .0", () => {
		expect(aprecioDisplayText(5, 1)).toBe("5.0 (1)");
	});
});
