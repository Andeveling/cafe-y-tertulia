"use server";

import {
	type ActionContext,
	type ActionResult,
	runServerAction,
} from "@/lib/server-action";

/**
 * Rutas que muestran el rating: la Sala (etapa Cierre) y la página del material.
 * El material se deriva de la Sesión (nunca del formulario).
 */
function ratingRevalidate(sessionId: string) {
	return async ({ supabase }: ActionContext): Promise<string[]> => {
		const paths = [
			`/materials/sessions/${sessionId}/room`,
			`/materials/sessions/${sessionId}`,
		];
		const { data } = await supabase
			.from("sessions")
			.select("material_id")
			.eq("id", sessionId)
			.maybeSingle();
		if (data) {
			paths.push(`/materials/${data.material_id}`);
			paths.push("/materials");
		}
		return paths;
	};
}

export async function openRatingAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const sessionId = String(formData.get("session_id") ?? "");
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("open_session_rating", {
				target_session_id: sessionId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: ratingRevalidate(sessionId),
	});
}

export async function castVoteAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const sessionId = String(formData.get("session_id") ?? "");
	const stars = Number(formData.get("stars"));
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("cast_session_vote", {
				target_session_id: sessionId,
				p_stars: stars,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: ratingRevalidate(sessionId),
	});
}

export async function closeRatingAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const sessionId = String(formData.get("session_id") ?? "");
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("close_session_rating", {
				target_session_id: sessionId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: ratingRevalidate(sessionId),
	});
}

export async function clearRatingAction(
	_prev: ActionResult,
	formData: FormData,
): Promise<ActionResult> {
	const sessionId = String(formData.get("session_id") ?? "");
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("clear_session_rating", {
				target_session_id: sessionId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: ratingRevalidate(sessionId),
	});
}
