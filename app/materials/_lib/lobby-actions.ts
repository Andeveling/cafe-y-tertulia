"use server";

import { type ActionResult, runServerAction } from "@/lib/server-action";

function lobbyPath(sessionId: string) {
	return `/materials/sessions/${sessionId}/lobby`;
}

function roomPath(sessionId: string) {
	return `/materials/sessions/${sessionId}/room`;
}

export async function joinLobby(sessionId: string): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			const { data: session } = await supabase
				.from("sessions")
				.select("status")
				.eq("id", sessionId)
				.maybeSingle();
			if (!session || session.status !== "lobby") {
				return { ok: false, error: "El lobby no está abierto." };
			}

			const { error } = await supabase.from("session_participants").upsert(
				{
					session_id: sessionId,
					member_id: user!.id,
					opt_out: false,
				},
				{ onConflict: "session_id,member_id" },
			);

			if (error) {
				// La policy participants_insert_member exige sesión en lobby;
				// si avanzó entre el chequeo y el upsert, PostgREST devuelve
				// el RLS en inglés — lo traducimos al mensaje de dominio.
				if (error.code === "42501") {
					return { ok: false, error: "El lobby no está abierto." };
				}
				return { ok: false, error: error.message };
			}
		},
		revalidate: async () => [lobbyPath(sessionId), roomPath(sessionId)],
	});
}

export async function leaveLobby(sessionId: string): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			const { error } = await supabase
				.from("session_participants")
				.delete()
				.eq("session_id", sessionId)
				.eq("member_id", user!.id);

			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [lobbyPath(sessionId), roomPath(sessionId)],
	});
}

export async function setOptOut(
	sessionId: string,
	optOut: boolean,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			const { error } = await supabase
				.from("session_participants")
				.update({ opt_out: optOut })
				.eq("session_id", sessionId)
				.eq("member_id", user!.id);

			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [lobbyPath(sessionId), roomPath(sessionId)],
	});
}

/** Ejecuta el Sorteo una vez (RPC). Nadie ve asignaciones en `hidden`. */
export async function runDraw(sessionId: string): Promise<ActionResult> {
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("execute_draw", {
				target_session_id: sessionId,
			});
			if (error) return { ok: false, error: error.message };
		},
		revalidate: async () => [lobbyPath(sessionId), roomPath(sessionId)],
	});
}
