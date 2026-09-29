import { z } from "zod";
import type { MaterialKind } from "./constants";
import { optionalHttpsUrl } from "./material-urls";

export const BIBLIOTECA_KINDS = [
	"book",
	"podcast",
	"video",
	"article",
] as const;

export const BIBLIOTECA_MOTIVE_MAX_LENGTH = 500;

export const bibliotecaInputSchema = z.object({
	title: z.string().trim().min(1, "El título es obligatorio."),
	author: z.string().trim().min(1, "El autor es obligatorio."),
	kind: z.enum(BIBLIOTECA_KINDS),
	imageUrl: optionalHttpsUrl("La imagen").optional(),
	sourceUrl: optionalHttpsUrl("La fuente").optional(),
	motive: z
		.string()
		.trim()
		.max(
			BIBLIOTECA_MOTIVE_MAX_LENGTH,
			"El motivo es demasiado largo (máx 500).",
		)
		.optional(),
});

export type BibliotecaInput = {
	title: string;
	author: string;
	kind: MaterialKind;
	imageUrl?: string | null;
	sourceUrl?: string | null;
	motive?: string | null;
};

export type NormalizedBibliotecaInput = {
	title: string;
	author: string;
	kind: MaterialKind;
	image_url: string | null;
	source_url: string | null;
	motive: string | null;
};

function toNullableText(value?: string | null): string | null {
	const trimmed = (value ?? "").trim();
	return trimmed === "" ? null : trimmed;
}

/** Recorta y convierte vacíos en null. La DB nunca ve ''. */
export function normalizeBibliotecaInput(
	input: BibliotecaInput,
): NormalizedBibliotecaInput {
	return {
		title: input.title.trim(),
		author: input.author.trim(),
		kind: input.kind,
		image_url: toNullableText(input.imageUrl),
		source_url: toNullableText(input.sourceUrl),
		motive: toNullableText(input.motive),
	};
}
