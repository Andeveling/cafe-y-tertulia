import { describe, expect, it } from "vitest";
import {
	bibliotecaInputSchema,
	normalizeBibliotecaInput,
} from "@/app/materials/_lib/biblioteca-schema";

describe("biblioteca: esquema de entrada (#88)", () => {
	it("exige título y autor, acepta los 4 formatos", () => {
		expect(
			bibliotecaInputSchema.safeParse({
				title: "",
				author: "a",
				kind: "book",
			}).success,
		).toBe(false);
		for (const kind of ["book", "podcast", "video", "article"]) {
			expect(
				bibliotecaInputSchema.safeParse({ title: "t", author: "a", kind })
					.success,
			).toBe(true);
		}
	});

	it("rechaza URLs sin https", () => {
		expect(
			bibliotecaInputSchema.safeParse({
				title: "t",
				author: "a",
				kind: "book",
				sourceUrl: "http://ejemplo.com",
			}).success,
		).toBe(false);
	});

	it("recorta y convierte vacíos en null (la DB nunca ve '')", () => {
		expect(
			normalizeBibliotecaInput({
				title: "  Dune  ",
				author: "Herbert",
				kind: "book",
				imageUrl: "  ",
				sourceUrl: undefined,
				motive: "",
			}),
		).toEqual({
			title: "Dune",
			author: "Herbert",
			kind: "book",
			image_url: null,
			source_url: null,
			motive: null,
		});
	});
});
