import { describe, expect, it } from "vitest";
import { nextAssignmentState } from "@/app/materials/_lib/intervention";

describe("nextAssignmentState", () => {
	it("preparación → exposición", () => {
		expect(
			nextAssignmentState({
				current: "preparation",
				authorPresent: true,
				isLastForQuestion: true,
			}),
		).toBe("exposition");
	});

	it("exposición → complemento si autor presente y es el último", () => {
		expect(
			nextAssignmentState({
				current: "exposition",
				authorPresent: true,
				isLastForQuestion: true,
			}),
		).toBe("complement");
	});

	it("exposición → completa si no es el último de la pregunta", () => {
		expect(
			nextAssignmentState({
				current: "exposition",
				authorPresent: true,
				isLastForQuestion: false,
			}),
		).toBe("complete");
	});

	it("exposición → completa si el autor no está", () => {
		expect(
			nextAssignmentState({
				current: "exposition",
				authorPresent: false,
				isLastForQuestion: true,
			}),
		).toBe("complete");
	});

	it("complemento → completa", () => {
		expect(
			nextAssignmentState({
				current: "complement",
				authorPresent: true,
				isLastForQuestion: true,
			}),
		).toBe("complete");
	});

	it("oculta/completa no avanzan con continuar", () => {
		expect(
			nextAssignmentState({
				current: "hidden",
				authorPresent: true,
				isLastForQuestion: true,
			}),
		).toBeNull();
		expect(
			nextAssignmentState({
				current: "complete",
				authorPresent: true,
				isLastForQuestion: true,
			}),
		).toBeNull();
	});
});
