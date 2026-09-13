import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Db = SupabaseClient<Database>;

export type RoomRosterMember = {
	id: string;
	display_name: string;
};

/** Miembros activos del club: universo invitable a la Sala. */
export async function getRoomRosterMembers(
	supabase: Db,
): Promise<RoomRosterMember[]> {
	const { data, error } = await supabase
		.from("members")
		.select("id, display_name")
		.eq("status", "active");
	if (error) throw error;
	return data ?? [];
}

/** Miembros con convocatoria pending en esta sesión (para no re-llamar). */
export async function getPendingConvocatoriaIds(
	supabase: Db,
	sessionId: string,
): Promise<string[]> {
	const { data, error } = await supabase
		.from("convocatorias")
		.select("to_id")
		.eq("session_id", sessionId)
		.eq("status", "pending");
	if (error) return [];
	return (data ?? []).map((r) => r.to_id);
}
