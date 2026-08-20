"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isActiveMember } from "./members";
import { createQuestion, toggleOutsideDraw } from "./questions";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Un Miembro activo aporta una Pregunta a una Sesión en `preparation`
 * (SPEC §4.1). La autoría se toma de la sesión, nunca del formulario.
 * Firma de useActionState: (prevState, formData).
 */
export async function createQuestionAction(
	_prevState: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) {
		return {
			ok: false,
			error: "Debes iniciar sesión para aportar una pregunta.",
		};
	}

	if (!(await isActiveMember(supabase, user.id))) {
		return {
			ok: false,
			error: "Solo los Miembros del club pueden aportar preguntas.",
		};
	}

	const sessionId = formData.get("session_id");
	const text = String(formData.get("text") ?? "").trim();

	if (typeof sessionId !== "string") {
		return { ok: false, error: "Faltan datos de la Sesión." };
	}
	if (text.length === 0) {
		return { ok: false, error: "La pregunta no puede estar vacía." };
	}

	// El material se deriva de la Sesión (nunca del formulario): la página
	// revalida sobre la ruta del material correcta.
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
			authorId: user.id,
			text,
		});
	} catch {
		return {
			ok: false,
			error:
				"No se pudo aportar la pregunta. La Sesión puede no estar en preparación.",
		};
	}

	revalidatePath(`/materiales/${session.material_id}`);
	return { ok: true };
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
	const supabase = await createClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) {
		return { ok: false, error: "Debes iniciar sesión." };
	}

	if (!(await isActiveMember(supabase, user.id))) {
		return {
			ok: false,
			error: "Solo los Miembros del club pueden modificar preguntas.",
		};
	}

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

	revalidatePath(`/materiales/${question.material_id}`);
	return { ok: true };
}
