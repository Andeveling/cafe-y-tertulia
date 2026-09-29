import { describe, expect, it } from "vitest";
import {
	hrefForGroup,
	landingPath,
	resolveActiveGroup,
	sectionFromGroupPath,
	slugFromGroupPath,
} from "@/lib/groups/active-group";

describe("slugFromGroupPath", () => {
	it("lee el slug y deja fuera join", () => {
		expect(slugFromGroupPath("/g/familia/sessions")).toBe("familia");
		expect(slugFromGroupPath("/g/join")).toBeNull();
		expect(slugFromGroupPath("/profile")).toBeNull();
	});
});

describe("sectionFromGroupPath", () => {
	it("un formulario vuelve a la lista al cambiar de grupo", () => {
		expect(sectionFromGroupPath("/g/familia/materials/new")).toBe("materials");
		expect(sectionFromGroupPath("/g/familia/sessions")).toBe("sessions");
		expect(sectionFromGroupPath("/g/familia")).toBe("home");
	});
});

describe("landingPath", () => {
	it("no inventa un default cuando hay varios y no hay memoria", () => {
		expect(landingPath(["familia", "trabajo"], undefined)).toBe("/g");
		expect(landingPath(["familia", "trabajo"], "trabajo")).toBe(
			"/g/trabajo/sessions",
		);
		expect(landingPath(["familia"], undefined)).toBe("/g/familia/sessions");
		expect(landingPath([], "familia")).toBe("/g");
	});
});

describe("hrefForGroup", () => {
	it("conserva la sección", () => {
		expect(hrefForGroup("trabajo", "materials")).toBe("/g/trabajo/materials");
	});
});

describe("resolveActiveGroup", () => {
	const groups = [{ slug: "familia" }, { slug: "trabajo" }];

	it("la URL manda sobre la memoria", () => {
		expect(
			resolveActiveGroup(groups, "/g/trabajo/sessions", "familia"),
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
		expect(resolveActiveGroup(groups, "/g/join", "familia")).toBeNull();
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
