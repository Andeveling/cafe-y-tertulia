"use server";

import { type ActionResult, runServerAction } from "@/lib/server-action";

function stagePath(sessionId: string) {
	return `/materials/sessions/${sessionId}/stage`;
}

export async function revealNext(sessionId: string): Promise<ActionResult> {
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("reveal_next_assignment", {
				target_session_id: sessionId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [stagePath(sessionId)],
	});
}

export async function continueIntervention(
	sessionId: string,
): Promise<ActionResult> {
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("advance_intervention", {
				target_session_id: sessionId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [stagePath(sessionId)],
	});
}

export async function saveNotes(
	assignmentId: string,
	sessionId: string,
	notes: string,
): Promise<ActionResult> {
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("save_assignment_notes", {
				target_assignment_id: assignmentId,
				new_notes: notes,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [stagePath(sessionId)],
	});
}
