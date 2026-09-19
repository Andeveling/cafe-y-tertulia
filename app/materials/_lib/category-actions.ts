"use server";

import { type ActionResult, runServerAction } from "@/lib/server-action";

/**
 * Reemplaza las categorías de un material (variante A del prototipo).
 * Solo Miembros activos (cerradura de ADR 0005 vía requireMember + RLS).
 * Material inexistente e ids desconocidos se rechazan antes de tocar el puente.
 */
export async function setMaterialCategories(
	materialId: string,
	categoryIds: string[],
): Promise<ActionResult> {
	return runServerAction({
		requireMember: true,
		run: async ({ supabase }) => {
			const { data: material, error: materialError } = await supabase
				.from("materials")
				.select("id")
				.eq("id", materialId)
				.maybeSingle();
			if (materialError || !material) {
				return { ok: false, error: "No se encontró el material." };
			}
			const { data: known, error: knownError } = await supabase
				.from("categories")
				.select("id");
			if (knownError || !known) {
				return { ok: false, error: "No se pudieron leer las categorías." };
			}
			const knownIds = new Set(known.map((c) => c.id));
			const picked = [...new Set(categoryIds)].filter((id) => knownIds.has(id));
			if (picked.length !== [...new Set(categoryIds)].length) {
				return { ok: false, error: "Hay categorías desconocidas." };
			}

			const { error: deleteError } = await supabase
				.from("material_categories")
				.delete()
				.eq("material_id", materialId);
			if (deleteError) {
				return {
					ok: false,
					error: `No se pudo etiquetar: ${deleteError.message}`,
				};
			}
			if (picked.length > 0) {
				const { error: insertError } = await supabase
					.from("material_categories")
					.insert(
						picked.map((category_id) => ({
							material_id: materialId,
							category_id,
						})),
					);
				if (insertError) {
					return {
						ok: false,
						error: `No se pudo etiquetar: ${insertError.message}`,
					};
				}
			}
		},
		revalidate: () => [`/materials/${materialId}`],
	});
}
