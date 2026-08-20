import type { z } from "zod";

/**
 * Parse FormData into a typed object using a zod schema.
 * Returns a tagged result so the caller can decide how to surface errors
 * (redirect with a query param, return a state, etc.) without throwing.
 */
export async function parseForm<S extends z.ZodTypeAny>(
	schema: S,
	formData: FormData,
): Promise<{ ok: true; data: z.output<S> } | { ok: false; error: z.ZodError }> {
	const raw = Object.fromEntries(formData.entries());
	const result = await schema.safeParseAsync(raw);
	if (result.success) {
		return { ok: true, data: result.data };
	}
	return { ok: false, error: result.error };
}
