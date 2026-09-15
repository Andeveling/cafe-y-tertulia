import { describe, expect, it } from "vitest";
import { resuelveConvocatoria } from "@/app/_lib/convocatoria";

const roster = [
	{ id: "m-1", display_name: "Ana", estado: "en_linea" as const },
	{ id: "m-2", display_name: "Luis", estado: "ausente" as const },
	{ id: "m-3", display_name: "Mia", estado: "en_sesion" as const },
	{ id: "m-4", display_name: "Zoe", estado: "desconectado" as const },
];

describe("resuelveConvocatoria", () => {
	it("Llamar solo a En línea y Ausente; En sesión es etiqueta", () => {
		const filas = resuelveConvocatoria({ roster });

		expect(filas.filter((f) => f.llamable).map((f) => f.id)).toEqual([
			"m-1",
			"m-2",
		]);
		expect(filas.find((f) => f.id === "m-3")).toMatchObject({
			llamable: false,
			enOtraSala: true,
		});
		expect(filas.find((f) => f.id === "m-4")?.llamable).toBe(false);
	});

	it("no se muestra a sí mismo", () => {
		const filas = resuelveConvocatoria({ roster, selfId: "m-1" });
		expect(filas.map((f) => f.id)).toEqual(["m-2", "m-3", "m-4"]);
	});

	it("marca pending sin excluir; En sesión sigue sin ser llamable", () => {
		const filas = resuelveConvocatoria({
			roster,
			pendingIds: ["m-1", "m-3"],
		});
		expect(filas.find((f) => f.id === "m-1")).toMatchObject({
			pending: true,
			llamable: false,
		});
		expect(filas.find((f) => f.id === "m-3")).toMatchObject({
			pending: true,
			llamable: false,
			enOtraSala: true,
		});
		expect(filas.find((f) => f.id === "m-2")?.pending).toBe(false);
	});
});
