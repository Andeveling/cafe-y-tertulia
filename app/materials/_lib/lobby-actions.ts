"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { success: true };

function lobbyPath(sessionId: string) {
	return `/materials/sessions/${sessionId}/lobby`;
}

export async function joinLobby(sessionId: string): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: "Debes iniciar sesión." };

	const { data: session } = await supabase
		.from("sessions")
		.select("status")
		.eq("id", sessionId)
		.maybeSingle();
	if (!session || session.status !== "lobby") {
		return { error: "El lobby no está abierto." };
	}

	const { error } = await supabase.from("session_participants").upsert(
		{
			session_id: sessionId,
			member_id: user.id,
			opt_out: false,
		},
		{ onConflict: "session_id,member_id" },
	);

	if (error) return { error: error.message };
	revalidatePath(lobbyPath(sessionId));
	return { success: true };
}

export async function leaveLobby(sessionId: string): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: "Debes iniciar sesión." };

	const { error } = await supabase
		.from("session_participants")
		.delete()
		.eq("session_id", sessionId)
		.eq("member_id", user.id);

	if (error) return { error: error.message };
	revalidatePath(lobbyPath(sessionId));
	return { success: true };
}

export async function setOptOut(
	sessionId: string,
	optOut: boolean,
): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: "Debes iniciar sesión." };

	const { error } = await supabase
		.from("session_participants")
		.update({ opt_out: optOut })
		.eq("session_id", sessionId)
		.eq("member_id", user.id);

	if (error) return { error: error.message };
	revalidatePath(lobbyPath(sessionId));
	return { success: true };
}

/** Ejecuta el Sorteo una vez (RPC). Nadie ve asignaciones en `hidden`. */
export async function runDraw(sessionId: string): Promise<ActionResult> {
	const supabase = await createClient();
	const { error } = await supabase.rpc("execute_draw", {
		target_session_id: sessionId,
	});
	if (error) return { error: error.message };
	revalidatePath(lobbyPath(sessionId));
	return { success: true };
}
