import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Sienta al miembro en la mesa si aún no está. No pisa un Espectador
 * ni un opt-out: el conflicto de clave se ignora.
 */
export async function seatIfAbsent(
	supabase: SupabaseClient<Database>,
	sessionId: string,
	userId: string,
): Promise<{ seated: boolean; error?: string }> {
	const { error } = await supabase.from("session_participants").insert({
		session_id: sessionId,
		member_id: userId,
		role: "member",
		opt_out: false,
	});
	if (!error) return { seated: true };
	if (error.code === "23505") return { seated: false };
	return { seated: false, error: error.message };
}
