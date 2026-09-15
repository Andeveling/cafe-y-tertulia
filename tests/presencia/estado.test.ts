import { describe, expect, it } from "vitest";
import {
	formateaUltimaVez,
	ordenaPorEstado,
	puedeLlamar,
	resuelveEstado,
} from "@/lib/presencia/estado";

const AHORA = 1_700_000_000_000;

describe("resuelveEstado", () => {
	it("vivo en sala → en_sesion aunque lleve quieto", () => {
		expect(
			resuelveEstado({
				vivo: true,
				enSala: true,
				ultimaActividad: AHORA - 30 * 60_000,
				ahora: AHORA,
			}),
		).toBe("en_sesion");
	});

	it("vivo fuera de sala y activo → en_linea", () => {
		expect(
			resuelveEstado({
				vivo: true,
				enSala: false,
				ultimaActividad: AHORA - 60_000,
				ahora: AHORA,
			}),
		).toBe("en_linea");
	});

	it("vivo fuera de sala e inactivo 5 min → ausente", () => {
		expect(
			resuelveEstado({
				vivo: true,
				enSala: false,
				ultimaActividad: AHORA - 5 * 60_000,
				ahora: AHORA,
			}),
		).toBe("ausente");
	});

	it("no vivo → desconectado", () => {
		expect(
			resuelveEstado({
				vivo: false,
				enSala: false,
				ultimaActividad: AHORA,
				ahora: AHORA,
			}),
		).toBe("desconectado");
	});
});

describe("puedeLlamar", () => {
	it("solo en_linea y ausente", () => {
		expect(puedeLlamar("en_linea")).toBe(true);
		expect(puedeLlamar("ausente")).toBe(true);
		expect(puedeLlamar("en_sesion")).toBe(false);
		expect(puedeLlamar("desconectado")).toBe(false);
	});
});

describe("ordenaPorEstado", () => {
	it("agrupa en_sesion, en_linea, ausente, desconectado y luego nombre", () => {
		const out = ordenaPorEstado([
			{ id: "d", display_name: "Zoe", estado: "desconectado" },
			{ id: "b", display_name: "Luis", estado: "en_linea" },
			{ id: "a", display_name: "Ana", estado: "en_sesion" },
			{ id: "c", display_name: "Mia", estado: "ausente" },
			{ id: "e", display_name: "Alba", estado: "en_linea" },
		]);
		expect(out.map((m) => m.id)).toEqual(["a", "e", "b", "c", "d"]);
	});
});

describe("formateaUltimaVez", () => {
	it("menos de 1 min → ahora mismo", () => {
		expect(formateaUltimaVez(AHORA - 10_000, AHORA)).toBe("ahora mismo");
	});
	it("minutos y horas", () => {
		expect(formateaUltimaVez(AHORA - 5 * 60_000, AHORA)).toBe("hace 5 min");
		expect(formateaUltimaVez(AHORA - 2 * 3_600_000, AHORA)).toBe("hace 2 h");
	});
	it("sin dato → nunca", () => {
		expect(formateaUltimaVez(null, AHORA)).toBe("nunca");
	});
});
