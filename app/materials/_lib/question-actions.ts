"use server";

import { type ActionResult, runServerAction } from "@/lib/server-action";
import { createQuestion, toggleOutsideDraw } from "./questions";

export type { ActionResult };

/**
 * Un Miembro activo aporta una Pregunta a una Sesión en `preparation`
 * (SPEC §4.1). La autoría se toma de la sesión, nunca del formulario.
 * Firma de useActionState: (prevState, formData).
 */
export async function createQuestionAction(
	_prevState: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	return runServerAction({
		requireMember: true,
		notSignedInMessage: "Debes iniciar sesión para aportar una pregunta.",
		memberErrorMessage: "Solo los Miembros del club pueden aportar preguntas.",
		run: async ({ supabase, user }) => {
			const sessionId = formData.get("session_id");
			const text = String(formData.get("text") ?? "").trim();

			if (typeof sessionId !== "string") {
				return { ok: false, error: "Faltan datos de la Sesión." };
			}
			if (text.length === 0) {
				return { ok: false, error: "La pregunta no puede estar vacía." };
			}

			// El material se deriva de la Sesión (nunca del formulario).
			const { data: session, error: sessionError } = await supabase
				.from("sessions")
				.select("material_id")
				.eq("id", sessionId)
				.maybeSingle();

			if (sessionError || !session) {
				return { ok: false, error: "La Sesión no existe." };
			}

			try {
				await createQuestion(supabase, {
					sessionId,
					materialId: session.material_id,
					authorId: user!.id,
					text,
				});
			} catch {
				return {
					ok: false,
					error:
						"No se pudo aportar la pregunta. La Sesión puede no estar en preparación.",
				};
			}
		},
		revalidate: async ({ supabase }) => {
			const sessionId = formData.get("session_id");
			if (typeof sessionId !== "string") return [];
			const { data } = await supabase
				.from("sessions")
				.select("material_id")
				.eq("id", sessionId)
				.maybeSingle();
			return data ? [`/materials/${data.material_id}`] : [];
		},
	});
}

/**
 * El moderador marca/desmarca "Fuera de sorteo" (duplicada o fuera de
 * contexto). RLS limita el UPDATE al moderador de la Sesión.
 * Firma de useActionState: (prevState, formData).
 */
export async function toggleOutsideDrawAction(
	_prevState: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	return runServerAction({
		requireMember: true,
		notSignedInMessage: "Debes iniciar sesión.",
		memberErrorMessage:
			"Solo los Miembros del club pueden modificar preguntas.",
		run: async ({ supabase }) => {
			const questionId = formData.get("question_id");
			const outsideDraw = formData.get("outside_draw") === "true";

			if (typeof questionId !== "string") {
				return { ok: false, error: "Faltan datos de la Pregunta." };
			}

			// El material se deriva de la Pregunta (nunca del formulario).
			const { data: question, error: questionError } = await supabase
				.from("questions")
				.select("material_id")
				.eq("id", questionId)
				.maybeSingle();

			if (questionError || !question) {
				return { ok: false, error: "La Pregunta no existe." };
			}

			try {
				await toggleOutsideDraw(supabase, questionId, outsideDraw);
			} catch {
				return {
					ok: false,
					error:
						"No se pudo marcar la pregunta. Solo el moderador de la Sesión puede hacerlo.",
				};
			}
		},
		revalidate: async ({ supabase }) => {
			const questionId = formData.get("question_id");
			if (typeof questionId !== "string") return [];
			const { data } = await supabase
				.from("questions")
				.select("material_id")
				.eq("id", questionId)
				.maybeSingle();
			return data ? [`/materials/${data.material_id}`] : [];
		},
	});
}
