import { describe, expect, it } from "vitest";
import {
	PACT_WINDOW_DAYS,
	canApprovePact,
	cancelOtherPendingPacts,
	hasQuorum,
	isPactExpired,
	needsFallbackToDraw,
	pactExpiresAt,
	quorumNeeded,
} from "@/app/materials/_lib/pacto-material";

const DAY = 24 * 60 * 60 * 1000;

describe("pacto: mayoría simple (#90, historias 19)", () => {
	it("quórum es mitad + 1: 2 de 3, 3 de 5, 1 de 1", () => {
		expect(quorumNeeded(1)).toBe(1);
		expect(quorumNeeded(3)).toBe(2);
		expect(quorumNeeded(5)).toBe(3);
		expect(quorumNeeded(4)).toBe(3);
	});

	it("aprueba con mayoría simple dentro de la ventana", () => {
		expect(hasQuorum(2, 3)).toBe(true);
		expect(hasQuorum(1, 3)).toBe(false);
		expect(hasQuorum(3, 5)).toBe(true);
		expect(hasQuorum(2, 5)).toBe(false);
	});
});

describe("pacto: ventana 7 días (#90, historias 18, 20)", () => {
	it("la ventana es fija de 7 días", () => {
		expect(PACT_WINDOW_DAYS).toBe(7);
		const created = new Date("2026-09-01T00:00:00Z");
		expect(pactExpiresAt(created).toISOString()).toBe(
			new Date("2026-09-08T00:00:00Z").toISOString(),
		);
	});

	it("expira al día 7 y no antes", () => {
		const created = new Date("2026-09-01T00:00:00Z");
		const expires = pactExpiresAt(created);
		expect(
			isPactExpired(expires, new Date("2026-09-07T23:59:59Z")),
		).toBe(false);
		expect(isPactExpired(expires, new Date("2026-09-08T00:00:00Z"))).toBe(
			true,
		);
	});

	it("no se puede aprobar un pacto expirado ni dos veces", () => {
		const created = new Date("2026-09-01T00:00:00Z");
		const expires = pactExpiresAt(created);
		expect(
			canApprovePact("pending", expires, new Date("2026-09-02T00:00:00Z"), false),
		).toBe(true);
		expect(
			canApprovePact("pending", expires, new Date("2026-09-09T00:00:00Z"), false),
		).toBe(false);
		expect(
			canApprovePact("pending", expires, new Date("2026-09-02T00:00:00Z"), true),
		).toBe(false);
		expect(
			canApprovePact("agreed", expires, new Date("2026-09-02T00:00:00Z"), false),
		).toBe(false);
	});
});

describe("pacto: fallback a sorteo al día 7 sin quórum (#90, historia 20)", () => {
	it("cae a sorteo solo si expiró pendiente sin quórum", () => {
		const created = new Date("2026-09-01T00:00:00Z");
		const expires = pactExpiresAt(created);
		const late = new Date("2026-09-09T00:00:00Z");
		const early = new Date("2026-09-02T00:00:00Z");
		expect(needsFallbackToDraw("pending", 1, 3, expires, late)).toBe(true);
		expect(needsFallbackToDraw("pending", 2, 3, expires, late)).toBe(false);
		expect(needsFallbackToDraw("pending", 1, 3, expires, early)).toBe(false);
		expect(needsFallbackToDraw("agreed", 1, 3, expires, late)).toBe(false);
	});
});

describe("pacto: cancela el sorteo pendiente (#90, historia 21)", () => {
	it("al acordar un pacto se cancelan los otros pendientes del grupo", () => {
		const pending = [
			{ id: "p1", status: "pending" as const },
			{ id: "p2", status: "pending" as const },
			{ id: "p3", status: "agreed" as const },
		];
		expect(cancelOtherPendingPacts(pending, "p1")).toEqual(["p2"]);
	});
});
