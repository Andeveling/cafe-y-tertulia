"use server";

import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function materialPath(sessionId: string): Promise<string | null> {
	const supabase = await createClient();
	const { data } = await supabase
		.from("sessions")
		.select("material_id")
		.eq("id", sessionId)
		.maybeSingle();
	return data ? `/materials/${data.material_id}` : null;
}

function revalidateSession(sessionId: string, materialId?: string | null) {
	revalidatePath(`/materials/sessions/${sessionId}/minigames`);
	revalidatePath(`/materials/sessions/${sessionId}/stage`);
	if (materialId) revalidatePath(`/materials/${materialId}`);
}

export async function createTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { ok: false, error: "Debes iniciar sesión." };

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

	revalidatePath(`/materials/${materialId}`);
	return { ok: true };
}

export async function startTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const sessionId = String(formData.get("session_id") ?? "");
	const triviaId = String(formData.get("trivia_id") ?? "");
	const { error } = await supabase.rpc("start_trivia_round", {
		target_session_id: sessionId,
		target_trivia_id: triviaId,
	});
	if (error) return { ok: false, error: error.message };
	revalidateSession(sessionId, await materialPath(sessionId));
	return { ok: true };
}

export async function answerTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const roundId = String(formData.get("round_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	const option = Number(formData.get("option_index"));
	const { error } = await supabase.rpc("answer_trivia", {
		target_round_id: roundId,
		p_option_index: option,
	});
	if (error) return { ok: false, error: error.message };
	revalidateSession(sessionId);
	return { ok: true };
}

export async function lockTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const roundId = String(formData.get("round_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	const { error } = await supabase.rpc("lock_trivia_question", {
		target_round_id: roundId,
	});
	if (error) return { ok: false, error: error.message };
	revalidateSession(sessionId);
	return { ok: true };
}

export async function nextTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const roundId = String(formData.get("round_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	const { error } = await supabase.rpc("next_trivia_question", {
		target_round_id: roundId,
	});
	if (error) return { ok: false, error: error.message };
	revalidateSession(sessionId);
	return { ok: true };
}

export async function finishTriviaAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const roundId = String(formData.get("round_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	const { error } = await supabase.rpc("finish_trivia_round", {
		target_round_id: roundId,
	});
	if (error) return { ok: false, error: error.message };
	revalidateSession(sessionId);
	return { ok: true };
}

export async function startTakeAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const sessionId = String(formData.get("session_id") ?? "");
	const prompt = String(formData.get("prompt") ?? "").trim();
	if (!prompt) return { ok: false, error: "Escribe la frase." };
	const { error } = await supabase.rpc("start_take", {
		target_session_id: sessionId,
		p_prompt: prompt,
	});
	if (error) return { ok: false, error: error.message };
	revalidateSession(sessionId);
	return { ok: true };
}

export async function voteTakeAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const takeId = String(formData.get("take_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	const position = String(formData.get("position") ?? "") as
		| "agree"
		| "disagree"
		| "neutral";
	const { error } = await supabase.rpc("vote_take", {
		target_take_id: takeId,
		p_position: position,
	});
	if (error) return { ok: false, error: error.message };
	revalidateSession(sessionId);
	return { ok: true };
}

export async function closeTakeAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const takeId = String(formData.get("take_id") ?? "");
	const sessionId = String(formData.get("session_id") ?? "");
	const { error } = await supabase.rpc("close_take", {
		target_take_id: takeId,
	});
	if (error) return { ok: false, error: error.message };
	revalidateSession(sessionId);
	return { ok: true };
}
