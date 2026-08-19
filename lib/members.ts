import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Db = SupabaseClient<Database>;

/**
 * ¿El usuario autenticado es un Miembro activo del club? La cerradura de fondo
 * es RLS (ADR 0005); este helper da errores tempranos y legibles en las
 * server actions.
 */
export async function isActiveMember(
	supabase: Db,
	userId: string,
): Promise<boolean> {
	const { data, error } = await supabase
		.from("members")
		.select("id")
		.eq("id", userId)
		.eq("status", "active")
		.maybeSingle();

	if (error) throw error;
	return data !== null;
}
