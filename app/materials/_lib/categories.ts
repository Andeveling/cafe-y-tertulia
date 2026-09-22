import "server-only";
import type { MaterialsClient } from "./constants";

export type Category = {
	id: string;
	key: string;
	name: string;
	icon: string;
};

/** Todas las categorías del club, en orden alfabético. */
export async function listCategories(
	supabase: MaterialsClient,
): Promise<Category[]> {
	const { data, error } = await supabase
		.from("categories")
		.select("id, key, name, icon")
		.order("name");
	if (error) throw error;
	return data;
}

/** Categorías de un material (puente 1..N). */
export async function getMaterialCategories(
	supabase: MaterialsClient,
	materialId: string,
): Promise<Category[]> {
	const { data, error } = await supabase
		.from("material_categories")
		.select("categories(id, key, name, icon)")
		.eq("material_id", materialId);
	if (error) throw error;
	return (data ?? [])
		.map((row) => row.categories)
		.filter((c): c is Category => c !== null)
		.sort((a, b) => a.name.localeCompare(b.name));
}
