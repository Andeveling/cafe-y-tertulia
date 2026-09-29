import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { MaterialKind } from "@/app/materials/_lib/constants";
import { canNominate } from "@/app/materials/_lib/postulacion";

type Nom = { kind: MaterialKind; status: string; proposedBy: string };

function nom(kind: MaterialKind, status = "active", proposedBy = "m1"): Nom {
	return { kind, status, proposedBy };
}

describe("postulación: 1 activa por formato y grupo (#88)", () => {
	it("permite 1 libro + 1 podcast a la vez, bloquea el 2.º libro", () => {
		const active = [nom("book")];
		expect(canNominate(active, "book", "m1").ok).toBe(false);
		expect(canNominate(active, "podcast", "m1").ok).toBe(true);
	});

	it("retirada o ganadora liberan el cupo del formato", () => {
		expect(canNominate([nom("book", "withdrawn")], "book", "m1").ok).toBe(true);
		expect(canNominate([nom("book", "won")], "book", "m1").ok).toBe(true);
	});

	it("el tope es por Miembro: otro Miembro sí puede postular el formato", () => {
		expect(canNominate([nom("book", "active", "m1")], "book", "m2").ok).toBe(
			true,
		);
	});
});

describe("postulación: migración con RLS y unicidad (#88)", () => {
	const sql = readFileSync(
		join(process.cwd(), "supabase/migrations/20260929000002_postulaciones.sql"),
		"utf8",
	);

	it("crea postulaciones con snapshot que sobrevive al borrado", () => {
		expect(sql).toContain("material_nominations");
		expect(sql).toContain("on delete set null");
	});

	it("tope 1 activa por formato/Miembro/Grupo en índice parcial", () => {
		expect(sql).toContain("material_nominations_one_active_per_kind");
		expect(sql).toContain("where status = 'active'");
	});

	it("RLS: Miembros leen postulados; solo el dueño postula/retira lo suyo", () => {
		expect(sql).toContain("is_group_member");
		expect(sql).toContain("proposed_by");
	});

	it("RPCs atómicos nominar y retirar", () => {
		expect(sql).toContain("nominate_from_library");
		expect(sql).toContain("withdraw_nomination");
	});
});
