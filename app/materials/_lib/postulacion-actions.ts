"use server";

import { type ActionResult, runServerAction } from "@/lib/server-action";

/**
 * Postula un item de la Biblioteca propia hacia un Grupo (#88).
 * El RPC valida membresía, propiedad y tope 1×formato de forma atómica.
 */
export async function nominateBibliotecaAction(input: {
	libraryItemId: string;
	groupId: string;
	slug: string;
}): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("nominate_from_library", {
				p_library_item_id: input.libraryItemId,
				p_group_id: input.groupId,
			});
			if (error) {
				return { ok: false, error: error.message };
			}
		},
		revalidate: () => [`/g/${input.slug}/materials`, "/profile"],
	});
}

/** Retira una postulación activa propia antes del bloqueo (#88). */
export async function withdrawPostulacionAction(input: {
	nominationId: string;
	slug: string;
}): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("withdraw_nomination", {
				p_nomination_id: input.nominationId,
			});
			if (error) {
				return { ok: false, error: error.message };
			}
		},
		revalidate: () => [`/g/${input.slug}/materials`, "/profile"],
	});
}
