import { describe, expect, it } from "vitest";
import {
	isValidMaterialUrl,
	MATERIAL_URL_MAX_LENGTH,
	toNullableUrl,
} from "@/app/materials/_lib/material-urls";

describe("toNullableUrl", () => {
	it("convierte vacío y blancos en null", () => {
		expect(toNullableUrl("")).toBeNull();
		expect(toNullableUrl("   ")).toBeNull();
		expect(toNullableUrl(null)).toBeNull();
		expect(toNullableUrl(undefined)).toBeNull();
	});

	it("recorta y conserva https", () => {
		expect(toNullableUrl("  https://x.com/a  ")).toBe("https://x.com/a");
	});
});

describe("isValidMaterialUrl", () => {
	it("acepta null y vacío", () => {
		expect(isValidMaterialUrl(null)).toBe(true);
		expect(isValidMaterialUrl("")).toBe(true);
	});

	it("acepta https válida", () => {
		expect(isValidMaterialUrl("https://example.com/recurso")).toBe(true);
	});

	it("rechaza http y no-url", () => {
		expect(isValidMaterialUrl("http://example.com")).toBe(false);
		expect(isValidMaterialUrl("nota")).toBe(false);
	});

	it("rechaza más de 2048", () => {
		expect(
			isValidMaterialUrl(`https://${"a".repeat(MATERIAL_URL_MAX_LENGTH)}`),
		).toBe(false);
	});
});
