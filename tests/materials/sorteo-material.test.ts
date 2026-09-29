import { describe, expect, it } from "vitest";
import type { MaterialKind } from "@/app/materials/_lib/constants";
import {
	buildDrawPool,
	canNominate,
	isValidDrawPool,
	markWinner,
	type NominationCandidate,
	type NominationStatus,
} from "@/app/materials/_lib/sorteo-material";

type Nom = NominationCandidate;

function nom(
	id: string,
	kind: MaterialKind,
	proposedBy = "m1",
	status: NominationStatus = "active",
): Nom {
	return { id, kind, proposedBy, status };
}

describe("sorteo de material: urna intra-formato (historias 11, 13)", () => {
	it("el moderador declara formato y solo entran postulados de ese formato", () => {
		const all = [
			nom("n1", "book", "m1"),
			nom("n2", "book", "m2"),
			nom("n3", "podcast", "m3"),
		];
		const pool = buildDrawPool(all, "book", ["m1", "m2", "m3"]);
		expect(pool.map((n) => n.id).sort()).toEqual(["n1", "n2"]);
		expect(isValidDrawPool(pool, "book").ok).toBe(true);
	});

	it("rechaza urna con menos de 2 postulados del formato", () => {
		const pool = buildDrawPool([nom("n1", "book", "m1")], "book", ["m1"]);
		expect(isValidDrawPool(pool, "book").ok).toBe(false);
	});

	it("ausentes y espectadores fuera: su postulación no entra a la urna", () => {
		const all = [
			nom("n1", "book", "m1"),
			nom("n2", "book", "m2"),
			nom("n3", "book", "m9"),
		];
		const pool = buildDrawPool(all, "book", ["m1", "m2"]);
		expect(pool.map((n) => n.id).sort()).toEqual(["n1", "n2"]);
	});

	it("tope 1 por presente: si hay duplicada solo entra una por miembro", () => {
		const all = [
			nom("n1", "book", "m1"),
			nom("n1b", "book", "m1"),
			nom("n2", "book", "m2"),
		];
		const pool = buildDrawPool(all, "book", ["m1", "m2"]);
		expect(pool.filter((n) => n.proposedBy === "m1")).toHaveLength(1);
		expect(isValidDrawPool(pool, "book").ok).toBe(true);
	});
});

describe("sorteo de material: tope 1 activa por formato (historia 6/13)", () => {
	it("bloquea el segundo postulado del mismo formato y permite otro formato", () => {
		const active = [nom("n1", "book", "m1")];
		expect(canNominate(active, "book", "m1").ok).toBe(false);
		expect(canNominate(active, "podcast", "m1").ok).toBe(true);
	});
});

describe("sorteo de material: resolución (historias 15, 23, 24)", () => {
	it("ganar marca solo la ganadora; perdedoras siguen activas", () => {
		const pool = [nom("n1", "book", "m1"), nom("n2", "book", "m2")];
		const next = markWinner(pool, "n1");
		expect(next.find((n) => n.id === "n1")?.status).toBe("won");
		expect(next.find((n) => n.id === "n2")?.status).toBe("active");
	});
});
