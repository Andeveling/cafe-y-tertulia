"use server";

import type { RoomStage } from "@/app/materials/_lib/room-types";
import { type ActionResult, runServerAction } from "@/lib/server-action";

function roomPath(sessionId: string) {
	return `/materials/sessions/${sessionId}/room`;
}

/** Crea una Pregunta en la sesión. author_id = auth.uid() (RLS). */
export async function saveQuestion(
	sessionId: string,
	materialId: string,
	text: string,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			const trimmed = text.trim();
			if (!trimmed) {
				return { ok: false, error: "La pregunta no puede estar vacía." };
			}

			const { error } = await supabase.from("questions").insert({
				session_id: sessionId,
				material_id: materialId,
				author_id: user!.id,
				text: trimmed,
			});

			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}

/** Confirma presencia: upsert session_participant como member. */
export async function confirmPresence(
	sessionId: string,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			const { error } = await supabase.from("session_participants").upsert(
				{
					session_id: sessionId,
					member_id: user!.id,
					role: "member" as const,
					opt_out: false,
				},
				{ onConflict: "session_id,member_id" },
			);

			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}

/** Avanza la etapa de la Sala (solo Moderador). */
export async function advanceRoomStage(
	sessionId: string,
	newStage: RoomStage,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("advance_room_stage", {
				target_session_id: sessionId,
				new_stage: newStage,
			});

			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}

/** Ejecuta el Sorteo una vez (RPC execute_draw). */
export async function executeDraw(sessionId: string): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("execute_draw", {
				target_session_id: sessionId,
			});

			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}

/** Alterna opt_out del participante para el Sorteo. */
export async function toggleOptOut(
	sessionId: string,
	currentOptOut: boolean,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			const { error } = await supabase
				.from("session_participants")
				.update({ opt_out: !currentOptOut })
				.eq("session_id", sessionId)
				.eq("member_id", user!.id);

			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}

/** El Moderador agrega o quita un Espectador. */
export async function setSpectator(
	sessionId: string,
	memberId: string,
	makeSpectator: boolean,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("set_spectator", {
				target_session_id: sessionId,
				target_member_id: memberId,
				make_spectator: makeSpectator,
			});

			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}
