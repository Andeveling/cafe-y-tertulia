import { z } from "zod";

export const MATERIAL_URL_MAX_LENGTH = 2048;

export const HTTPS_URL_PATTERN = /^https:\/\/\S+$/;

/** '' / blancos -> null. DB nunca ve ''. */
export function toNullableUrl(value?: string | null): string | null {
	const trimmed = (value ?? "").trim();
	return trimmed === "" ? null : trimmed;
}

export function isValidMaterialUrl(value?: string | null): boolean {
	const trimmed = (value ?? "").trim();
	if (trimmed === "") return true;
	return (
		trimmed.length <= MATERIAL_URL_MAX_LENGTH && HTTPS_URL_PATTERN.test(trimmed)
	);
}

/** Campo opcional de formulario: '' válido, si hay valor exige https + max. */
export const optionalHttpsUrl = (label: string) =>
	z
		.string()
		.trim()
		.max(MATERIAL_URL_MAX_LENGTH, `${label} demasiado larga (máx 2048).`)
		.refine((v) => v === "" || HTTPS_URL_PATTERN.test(v), {
			message: `${label} debe empezar por https://`,
		});
