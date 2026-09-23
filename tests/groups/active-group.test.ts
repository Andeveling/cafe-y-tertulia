import { describe, expect, it } from "vitest";
import {
	hrefForGroup,
	landingPath,
	resolveActiveGroup,
	sectionFromGroupPath,
	slugFromGroupPath,
} from "@/lib/groups/active-group";

describe("slugFromGroupPath", () => {
	it("lee el slug y deja fuera unirse", () => {
		expect(slugFromGroupPath("/g/familia/sesiones")).toBe("familia");
		expect(slugFromGroupPath("/g/unirse")).toBeNull();
		expect(slugFromGroupPath("/profile")).toBeNull();
	});
});

describe("sectionFromGroupPath", () => {
	it("un formulario vuelve a la lista al cambiar de grupo", () => {
		expect(sectionFromGroupPath("/g/familia/materiales/nuevo")).toBe(
			"materiales",
		);
		expect(sectionFromGroupPath("/g/familia/sesiones")).toBe("sesiones");
		expect(sectionFromGroupPath("/g/familia")).toBe("home");
	});
});

describe("landingPath", () => {
	it("no inventa un default cuando hay varios y no hay memoria", () => {
		expect(landingPath(["familia", "trabajo"], undefined)).toBe("/g");
		expect(landingPath(["familia", "trabajo"], "trabajo")).toBe(
			"/g/trabajo/sesiones",
		);
		expect(landingPath(["familia"], undefined)).toBe("/g/familia/sesiones");
		expect(landingPath([], "familia")).toBe("/g");
	});
});

describe("hrefForGroup", () => {
	it("conserva la sección", () => {
		expect(hrefForGroup("trabajo", "materiales")).toBe("/g/trabajo/materiales");
	});
});

describe("resolveActiveGroup", () => {
	const groups = [{ slug: "familia" }, { slug: "trabajo" }];

	it("la URL manda sobre la memoria", () => {
		expect(
			resolveActiveGroup(groups, "/g/trabajo/sesiones", "familia"),
		).toEqual({
			slug: "trabajo",
		});
	});

	it("fuera de un grupo usa la memoria", () => {
		expect(resolveActiveGroup(groups, "/profile", "familia")).toEqual({
			slug: "familia",
		});
	});

	it("en una ruta de grupo desconocida no finge un activo", () => {
		expect(resolveActiveGroup(groups, "/g/unirse", "familia")).toBeNull();
		expect(resolveActiveGroup(groups, "/g/ajeno", "familia")).toBeNull();
	});

	it("sin memoria ni URL no inventa un default con varios", () => {
		expect(resolveActiveGroup(groups, "/profile", null)).toBeNull();
		expect(resolveActiveGroup(groups, "/profile", "ajeno")).toBeNull();
	});

	it("con un solo grupo ese es el activo fuera de rutas de grupo", () => {
		expect(resolveActiveGroup([{ slug: "familia" }], "/profile", null)).toEqual(
			{
				slug: "familia",
			},
		);
	});
});
