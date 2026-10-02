import { describe, expect, it } from "vitest";
import {
	filterShelfMaterials,
	foldShelfText,
	isShelfFiltered,
	presentShelfKinds,
	presentShelfStatuses,
	type ShelfQuery,
} from "@/app/g/[slug]/materials/_lib/filter-shelf";

const cien: ShelfQuery = {
	title: "Cien años de soledad",
	author: "Gabriel García Márquez",
	kind: "book",
	status: "in_progress",
};
const podcast: ShelfQuery = {
	title: "El hilo",
	author: "Silvia Cruz",
	kind: "podcast",
	status: "finished",
};
const articulo: ShelfQuery = {
	title: "Sobre la mesa",
	author: "García Lorca",
	kind: "article",
	status: "proposed",
};

const shelf = [cien, podcast, articulo];

describe("foldShelfText", () => {
	it("quita tildes y mayúsculas", () => {
		expect(foldShelfText("García")).toBe("garcia");
	});
});

describe("filterShelfMaterials", () => {
	it("sin filtros devuelve todo", () => {
		expect(
			filterShelfMaterials(shelf, { query: "  ", kind: "all", status: "all" }),
		).toEqual(shelf);
	});

	it("encuentra por título o autor, sin tildes", () => {
		expect(
			filterShelfMaterials(shelf, {
				query: "garcia",
				kind: "all",
				status: "all",
			}).map((item) => item.title),
		).toEqual(["Cien años de soledad", "Sobre la mesa"]);
	});

	it("exige todas las palabras", () => {
		expect(
			filterShelfMaterials(shelf, {
				query: "gabriel soledad",
				kind: "all",
				status: "all",
			}),
		).toEqual([cien]);
		expect(
			filterShelfMaterials(shelf, {
				query: "gabriel hilo",
				kind: "all",
				status: "all",
			}),
		).toEqual([]);
	});

	it("recorta por formato y estado a la vez", () => {
		expect(
			filterShelfMaterials(shelf, {
				query: "",
				kind: "book",
				status: "finished",
			}),
		).toEqual([]);
		expect(
			filterShelfMaterials(shelf, {
				query: "el",
				kind: "podcast",
				status: "all",
			}),
		).toEqual([podcast]);
	});
});

describe("opciones presentes", () => {
	it("oculta la fila si solo hay un formato o un estado", () => {
		expect(presentShelfKinds([cien])).toEqual([]);
		expect(
			presentShelfStatuses([cien, { ...podcast, status: "in_progress" }]),
		).toEqual([]);
	});

	it("ofrece solo lo que la estantería tiene, en orden de vida", () => {
		expect(presentShelfKinds(shelf)).toEqual(["book", "podcast", "article"]);
		expect(presentShelfStatuses(shelf)).toEqual([
			"proposed",
			"in_progress",
			"finished",
		]);
	});
});

describe("isShelfFiltered", () => {
	it("blancos no cuentan como filtro", () => {
		expect(isShelfFiltered({ query: "   ", kind: "all", status: "all" })).toBe(
			false,
		);
		expect(isShelfFiltered({ query: "", kind: "video", status: "all" })).toBe(
			true,
		);
	});
});
