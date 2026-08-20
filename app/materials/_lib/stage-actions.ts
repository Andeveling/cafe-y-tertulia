"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { success: true };

function stagePath(sessionId: string) {
	return `/materials/sessions/${sessionId}/stage`;
}

export async function revealNext(sessionId: string): Promise<ActionResult> {
	const supabase = await createClient();
	const { error } = await supabase.rpc("reveal_next_assignment", {
		target_session_id: sessionId,
	});
	if (error) return { error: error.message };
	revalidatePath(stagePath(sessionId));
	return { success: true };
}

export async function continueIntervention(
	sessionId: string,
): Promise<ActionResult> {
	const supabase = await createClient();
	const { error } = await supabase.rpc("advance_intervention", {
		target_session_id: sessionId,
	});
	if (error) return { error: error.message };
	revalidatePath(stagePath(sessionId));
	return { success: true };
}

export async function saveNotes(
	assignmentId: string,
	sessionId: string,
	notes: string,
): Promise<ActionResult> {
	const supabase = await createClient();
	const { error } = await supabase.rpc("save_assignment_notes", {
		target_assignment_id: assignmentId,
		new_notes: notes,
	});
	if (error) return { error: error.message };
	revalidatePath(stagePath(sessionId));
	return { success: true };
}
