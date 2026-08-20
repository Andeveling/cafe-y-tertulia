"use server";

import {
	type ActionContext,
	type ActionResult,
	runServerAction,
} from "@/lib/server-action";
import type { Json } from "@/lib/supabase/database.types";

/**
 * Rutas que muestran los minijuegos: la propia, el escenario y la página del
 * material. El material se deriva de la Sesión (nunca del formulario).
 */
function minigameRevalidate(sessionId: string) {
	return async ({ supabase }: ActionContext): Promise<string[]> => {
		const paths = [
			`/materials/sessions/${sessionId}/minigames`,
			`/materials/sessions/${sessionId}/stage`,
		];
		const { data } = await supabase
			.from("sessions")
			.select("material_id")
			.eq("id", sessionId)
			.maybeSingle();
		if (data) paths.push(`/materials/${data.material_id}`);
		return paths;
	};
}

export async function createTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const materialId = String(formData.get("material_id") ?? "");
			const title = String(formData.get("title") ?? "").trim();
			const itemsRaw = String(formData.get("items_json") ?? "");
			if (!materialId || !title) return { ok: false, error: "Faltan datos." };

			let items: unknown;
			try {
				items = JSON.parse(itemsRaw);
			} catch {
				return { ok: false, error: "Preguntas inválidas." };
			}
			if (!Array.isArray(items) || items.length < 3 || items.length > 5) {
				return { ok: false, error: "Necesitas 3 a 5 preguntas." };
			}

			const { error } = await supabase.rpc("create_trivia_with_items", {
				p_material_id: materialId,
				p_title: title,
				p_items: items as Json,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => {
			const materialId = String(formData.get("material_id") ?? "");
			return materialId ? [`/materials/${materialId}`] : [];
		},
	});
}

export async function startTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const sessionId = String(formData.get("session_id") ?? "");
	const triviaId = String(formData.get("trivia_id") ?? "");
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("start_trivia_round", {
				target_session_id: sessionId,
				target_trivia_id: triviaId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: minigameRevalidate(sessionId),
	});
}

export async function answerTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const roundId = String(formData.get("round_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	const option = Number(formData.get("option_index"));
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("answer_trivia", {
				target_round_id: roundId,
				p_option_index: option,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: minigameRevalidate(sessionId),
	});
}

export async function lockTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const roundId = String(formData.get("round_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("lock_trivia_question", {
				target_round_id: roundId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: minigameRevalidate(sessionId),
	});
}

export async function nextTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const roundId = String(formData.get("round_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("next_trivia_question", {
				target_round_id: roundId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: minigameRevalidate(sessionId),
	});
}

export async function finishTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const roundId = String(formData.get("round_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("finish_trivia_round", {
				target_round_id: roundId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: minigameRevalidate(sessionId),
	});
}

export async function startTakeAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const sessionId = String(formData.get("session_id") ?? "");
	const prompt = String(formData.get("prompt") ?? "").trim();
	if (!prompt) return { ok: false, error: "Escribe la frase." };
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("start_take", {
				target_session_id: sessionId,
				p_prompt: prompt,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: minigameRevalidate(sessionId),
	});
}

export async function voteTakeAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const takeId = String(formData.get("take_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	const position = String(formData.get("position") ?? "") as
		| "agree"
		| "disagree"
		| "neutral";
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("vote_take", {
				target_take_id: takeId,
				p_position: position,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: minigameRevalidate(sessionId),
	});
}

export async function closeTakeAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const takeId = String(formData.get("take_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("close_take", {
				target_take_id: takeId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: minigameRevalidate(sessionId),
	});
}
