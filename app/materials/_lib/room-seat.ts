import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Sienta al miembro en la mesa si aún no está. No pisa un Espectador
 * ni un opt-out: el conflicto de clave se ignora.
 *
 * Seam interno de la Sala: solo room-actions y la página de la Sala
 * importan este módulo (ver regla seat-via-sala en .dependency-cruiser.cjs).
 */
export async function seatIfAbsent(
	supabase: SupabaseClient<Database>,
	sessionId: string,
	userId: string,
): Promise<{ seated: boolean; error?: string }> {
	const { data: session, error: sessionError } = await supabase
		.from("sessions")
		.select("group_id")
		.eq("id", sessionId)
		.maybeSingle();
	if (sessionError || !session) {
		return { seated: false, error: "La Sesión no existe." };
	}
	const { error } = await supabase.from("session_participants").insert({
		session_id: sessionId,
		member_id: userId,
		role: "member",
		opt_out: false,
		group_id: session.group_id,
	});
	if (!error) return { seated: true };
	if (error.code === "23505") return { seated: false };
	return { seated: false, error: error.message };
}

/**
 * Primer asiento en lobby / Preguntas. El UPDATE con moderator_id null
 * es el que gana si dos entran a la vez; el trigger rechaza el resto.
 */
export async function claimModeratorIfAbsent(
	supabase: SupabaseClient<Database>,
	sessionId: string,
	userId: string,
): Promise<{ claimed: boolean }> {
	const { data, error } = await supabase
		.from("sessions")
		.update({ moderator_id: userId })
		.eq("id", sessionId)
		.is("moderator_id", null)
		.eq("status", "lobby")
		.eq("room_stage", "questions")
		.select("id");
	if (error) return { claimed: false };
	return { claimed: (data?.length ?? 0) > 0 };
}
