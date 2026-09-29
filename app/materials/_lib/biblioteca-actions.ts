"use server";

import { type ActionResult, runServerAction } from "@/lib/server-action";
import {
	type BibliotecaInput,
	bibliotecaInputSchema,
	type NormalizedBibliotecaInput,
	normalizeBibliotecaInput,
} from "./biblioteca-schema";

const BIBLIOTECA_REVALIDATE = ["/library"] as const;

/**
 * Valida y normaliza en un solo paso: los opcionales llegan como
 * null/undefined desde el cliente y el esquema solo acepta string,
 * así que los vacíos se presentan como "" (válido = ausente).
 */
function validateBibliotecaInput(
	input: BibliotecaInput,
): { data: NormalizedBibliotecaInput } | { error: ActionResult } {
	const parsed = bibliotecaInputSchema.safeParse({
		title: input.title,
		author: input.author,
		kind: input.kind,
		imageUrl: input.imageUrl ?? "",
		sourceUrl: input.sourceUrl ?? "",
		motive: input.motive ?? "",
	});
	if (!parsed.success) {
		const first = parsed.error.issues[0];
		return {
			error: { ok: false, error: first?.message ?? "Revisa los campos." },
		};
	}
	return { data: normalizeBibliotecaInput(input) };
}

/** Crea un item en la Biblioteca del Miembro en sesión (empieza vacía). */
export async function createBibliotecaAction(
	input: BibliotecaInput,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			if (!user) return { ok: false, error: "Debes iniciar sesión." };
			const validated = validateBibliotecaInput(input);
			if ("error" in validated) return validated.error;
			const { error } = await supabase.from("library_items").insert({
				...validated.data,
				owner_id: user.id,
			});
			if (error) {
				return { ok: false, error: `No se pudo guardar: ${error.message}` };
			}
		},
		revalidate: () => [...BIBLIOTECA_REVALIDATE],
	});
}

/** Edita un item propio (el RLS impide tocar lo ajeno). */
export async function updateBibliotecaAction(
	id: string,
	input: BibliotecaInput,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const validated = validateBibliotecaInput(input);
			if ("error" in validated) return validated.error;
			const { error } = await supabase
				.from("library_items")
				.update(validated.data)
				.eq("id", id);
			if (error) {
				return { ok: false, error: `No se pudo editar: ${error.message}` };
			}
		},
		revalidate: () => [...BIBLIOTECA_REVALIDATE],
	});
}

/** Borra un item propio. Las postulaciones guardan snapshot (SET NULL). */
export async function deleteBibliotecaAction(
	id: string,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase
				.from("library_items")
				.delete()
				.eq("id", id);
			if (error) {
				return { ok: false, error: `No se pudo borrar: ${error.message}` };
			}
		},
		revalidate: () => [...BIBLIOTECA_REVALIDATE],
	});
}
