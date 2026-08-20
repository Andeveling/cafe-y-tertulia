"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function revalidateRating(sessionId: string) {
	const supabase = await createClient();
	const { data } = await supabase
		.from("sessions")
		.select("material_id")
		.eq("id", sessionId)
		.maybeSingle();
	revalidatePath(`/materials/sessions/${sessionId}/rating`);
	revalidatePath(`/materials/sessions/${sessionId}/stage`);
	if (data) revalidatePath(`/materials/${data.material_id}`);
}

export async function openRatingAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const sessionId = String(formData.get("session_id") ?? "");
	const { error } = await supabase.rpc("open_session_rating", {
		target_session_id: sessionId,
	});
	if (error) return { ok: false, error: error.message };
	await revalidateRating(sessionId);
	return { ok: true };
}

export async function castVoteAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const sessionId = String(formData.get("session_id") ?? "");
	const stars = Number(formData.get("stars"));
	const { error } = await supabase.rpc("cast_session_vote", {
		target_session_id: sessionId,
		p_stars: stars,
	});
	if (error) return { ok: false, error: error.message };
	await revalidateRating(sessionId);
	return { ok: true };
}

export async function closeRatingAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const sessionId = String(formData.get("session_id") ?? "");
	const { error } = await supabase.rpc("close_session_rating", {
		target_session_id: sessionId,
	});
	if (error) return { ok: false, error: error.message };
	await revalidateRating(sessionId);
	return { ok: true };
}

export async function clearRatingAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const supabase = await createClient();
	const sessionId = String(formData.get("session_id") ?? "");
	const { error } = await supabase.rpc("clear_session_rating", {
		target_session_id: sessionId,
	});
	if (error) return { ok: false, error: error.message };
	await revalidateRating(sessionId);
	return { ok: true };
}
