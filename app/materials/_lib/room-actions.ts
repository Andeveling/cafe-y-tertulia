"use server";

import type { RoomStage } from "@/app/materials/_lib/room-types";
import { type ActionResult, runServerAction } from "@/lib/server-action";
import type { Database } from "@/lib/supabase/database.types";

function roomPath(sessionId: string) {
	return `/materials/sessions/${sessionId}/room`;
}

/** Crea una Pregunta en la sesión. author_id = auth.uid() (RLS). */
export async function saveQuestion(
	sessionId: string,
	materialId: string | null,
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

/**
 * Edita el texto de una Pregunta propia mientras la Sala esté en
 * room_stage='questions'. El RLS `questions_update_author` ya filtra por
 * autor + etapa; el `eq('author_id', user.id)` redundante da un error
 * legible si la RLS cambió o si la pregunta ya no es del usuario.
 */
export async function editQuestion(
	questionId: string,
	sessionId: string,
	text: string,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			const trimmed = text.trim();
			if (!trimmed) {
				return { ok: false, error: "La pregunta no puede estar vacía." };
			}

			const { error, count } = await supabase
				.from("questions")
				.update({ text: trimmed }, { count: "exact" })
				.eq("id", questionId)
				.eq("author_id", user!.id);

			if (error) return { ok: false, error: error.message };
			if (!count) {
				return {
					ok: false,
					error:
						"No se puede editar esta pregunta (puede que ya no sea tuya o la Sala avanzó de etapa).",
				};
			}
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}

/**
 * Borra una Pregunta propia mientras la Sala esté en room_stage='questions'.
 * Mismo criterio de defensa en profundidad que `editQuestion`.
 */
export async function deleteQuestion(
	questionId: string,
	sessionId: string,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			const { error, count } = await supabase
				.from("questions")
				.delete({ count: "exact" })
				.eq("id", questionId)
				.eq("author_id", user!.id);

			if (error) return { ok: false, error: error.message };
			if (!count) {
				return {
					ok: false,
					error:
						"No se puede borrar esta pregunta (puede que ya no sea tuya o la Sala avanzó de etapa).",
				};
			}
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
				new_stage: newStage as Database["public"]["Enums"]["room_stage"],
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

/**
 * Avanza a Sorteo y ejecuta el sorteo en la misma acción: entrar a la
 * etapa ES sortear. Si el sorteo falla, la etapa ya avanzó y la Sala
 * muestra el paso previo con reintentar (fallback honesto, sin bloqueo).
 */
export async function advanceToDraw(sessionId: string): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error: advanceError } = await supabase.rpc("advance_room_stage", {
				target_session_id: sessionId,
				new_stage: "draw" as Database["public"]["Enums"]["room_stage"],
			});
			if (advanceError) return { ok: false, error: advanceError.message };

			const { error: drawError } = await supabase.rpc("execute_draw", {
				target_session_id: sessionId,
			});
			if (drawError) return { ok: false, error: drawError.message };
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

/** El Moderador cede la moderación a otro participante (lobby, pre-sorteo). */
export async function transferModerator(
	sessionId: string,
	newModeratorId: string,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("transfer_moderator", {
				target_session_id: sessionId,
				new_moderator_id: newModeratorId,
			});

			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}

// ─── Debate actions (consolidadas de stage-actions.ts) ──────

/** Revela la siguiente asignación oculta (solo Moderador). */
export async function revealNext(sessionId: string): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("reveal_next_assignment", {
				target_session_id: sessionId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}

/** Avanza la Intervención actual un paso (solo Moderador). */
export async function continueIntervention(
	sessionId: string,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("advance_intervention", {
				target_session_id: sessionId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}

/**
 * +1 del Moderador en Exposición: suma 60 s al reloj (mueve el ancla atrás)
 * y registra lo hot que estuvo la pregunta (evento question_hot = bono al
 * autor). Solo Moderador, vía RPC `extend_exposition`.
 */
export async function extendExposition(
	assignmentId: string,
	sessionId: string,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("extend_exposition", {
				target_assignment_id: assignmentId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}

/** Vota corazón (1-5) en la fase activa de una Intervención. */
export async function castHeart(
	assignmentId: string,
	phase: "exposition" | "complement",
	value: number,
	sessionId: string,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			// TODO: quitar `as never` al regenerar database.types tras 20260919000000
			const { error } = await supabase.rpc(
				"cast_heart" as never,
				{
					target_assignment_id: assignmentId,
					p_phase: phase,
					p_value: value,
				} as never,
			);
			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}

// ─── Cierre actions ─────────────────────────────────────────

/**
 * Cierre consolidado de la Sesión (RPC close_session): congela el rating,
 * valida pendientes y pasa la Sesión a cerrada. Solo Moderador.
 */
export async function closeSession(sessionId: string): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("close_session", {
				target_session_id: sessionId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [roomPath(sessionId)],
	});
}
