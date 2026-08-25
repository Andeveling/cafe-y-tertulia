"use server";

import { type ActionResult, runServerAction } from "@/lib/server-action";

export async function convocarAction(
	sessionId: string,
	toId: string,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("convocar", {
				p_session_id: sessionId,
				p_to_id: toId,
			});
			if (error) return { ok: false, error: error.message };
		},
	});
}

export async function responderConvocatoriaAction(
	id: string,
	accept: boolean,
): Promise<ActionResult | { ok: true; sessionId: string }> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { data, error } = await supabase.rpc("responder_convocatoria", {
				p_id: id,
				p_accept: accept,
			});
			if (error || (accept && !data)) {
				return { ok: false, error: error?.message ?? "No se pudo responder." };
			}
			return { ok: true, sessionId: data ?? "" };
		},
	}) as Promise<ActionResult | { ok: true; sessionId: string }>;
}
