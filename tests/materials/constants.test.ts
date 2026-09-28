import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SESSION_LIFECYCLE_LABELS } from "@/app/materials/_lib/constants";

describe("SESSION_LIFECYCLE_LABELS", () => {
	it("nombra la acción contextual de cada estado", () => {
		expect(SESSION_LIFECYCLE_LABELS.preparation).toBe("Abrir sala");
		expect(SESSION_LIFECYCLE_LABELS.in_progress).toBe("Cerrar sesión");
		expect(SESSION_LIFECYCLE_LABELS.closed).toBe("Archivar");
	});

	it("no ofrece salto lobby → en curso (la Sala avanza vía Debate)", () => {
		expect("lobby" in SESSION_LIFECYCLE_LABELS).toBe(false);
		expect(Object.values(SESSION_LIFECYCLE_LABELS)).not.toContain(
			"Empezar tertulia",
		);
	});

	it("no usa 'Iniciar sesión' (choca con login)", () => {
		expect(Object.values(SESSION_LIFECYCLE_LABELS)).not.toContain(
			"Iniciar sesión",
		);
	});
});

describe("constants como módulo compartido client/server", () => {
	it("no importa server-only (lo usa AdvanceButton, un Client Component)", () => {
		const source = readFileSync(
			path.resolve(
				import.meta.dirname,
				"../../app/materials/_lib/constants.ts",
			),
			"utf8",
		);
		expect(source).not.toMatch(/from\s+["']server-only["']/);
		expect(source).not.toMatch(/^import\s+["']server-only["']/m);
	});
});
