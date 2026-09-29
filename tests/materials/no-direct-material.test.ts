import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");

const ACTIONS_SOURCE = "app/materials/_lib/materials-actions.ts";
const DIALOG_SOURCE = "app/_components/session-create-dialog.tsx";
const SHELF_SOURCE = "app/g/[slug]/materials/page.tsx";
const NEW_ROUTE_SOURCE = "app/g/[slug]/materials/new/page.tsx";

function readSource(rel: string): string {
	try {
		return readFileSync(join(root, rel), "utf8");
	} catch {
		return "";
	}
}

/**
 * #91: la estantería solo crece por sorteo o pacto. No existe
 * crear-Material-directo-al-Grupo en UI ni en actions.
 */
describe("sin propuesta directa a estantería (#91)", () => {
	it("materials-actions no expone createMaterial", async () => {
		const actions = (await import(
			"@/app/materials/_lib/materials-actions"
		)) as Record<string, unknown>;
		expect(actions).not.toHaveProperty("createMaterial");
	});

	it("createSession ya no acepta material inline", () => {
		const source = readSource(ACTIONS_SOURCE);
		expect(source).not.toMatch(/input\.material(?!Id)/);
		expect(source).not.toMatch(/material\?:\s*MaterialInput/);
		expect(source).toContain("export async function createSession");

		const dialog = readSource(DIALOG_SOURCE);
		expect(dialog).not.toMatch(/payload\.material(?!Id)/);
	});

	it("la estantería del grupo no ofrece proponer directo", () => {
		const page = readSource(SHELF_SOURCE);
		expect(page).not.toContain("Proponer material");
		expect(page).not.toContain("materials/new");
		expect(page).toContain("getMaterials");
	});

	it("la ruta nuevo redirige a la estantería sin formulario", () => {
		const page = readSource(NEW_ROUTE_SOURCE);
		expect(page).not.toContain("MaterialForm");
		expect(page).toContain("redirect");
	});

	it("el diálogo de sesión no ofrece material nuevo", () => {
		const dialog = readSource(DIALOG_SOURCE);
		expect(dialog).not.toContain('value="new"');
		expect(dialog).not.toContain("newTitle");
		expect(dialog).not.toContain("Nuevo");
		expect(dialog).toContain("Sin material");
	});

	it("la estantería sigue listando y la sesión nace de material existente", async () => {
		const facade = (await import("@/app/materials/_lib/materials")) as Record<
			string,
			unknown
		>;
		expect(typeof facade.getMaterials).toBe("function");
		expect(typeof facade.getMaterial).toBe("function");
		const actions = (await import(
			"@/app/materials/_lib/materials-actions"
		)) as Record<string, unknown>;
		expect(typeof actions.createSession).toBe("function");
		expect(typeof actions.advanceMaterial).toBe("function");
	});
});
