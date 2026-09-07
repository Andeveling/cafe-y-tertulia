"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Tablas por-participante que refrescan la Sala al cambiar. Filtro
 * `session_id` — exige replica identity FULL (ver migración
 * realtime_replica_identity_full) para que UPDATE/DELETE no se pierdan.
 */
export const ROOM_PARTICIPANT_TABLES = [
	"session_participants",
	"questions",
	"draws",
	"assignments",
	"trivia_rounds",
	"takes",
] as const;

/** sessions.room_stage UPDATE mueve el stepper (Presentes → Sorteo). */
export function roomSessionChangeFilter(sessionId: string) {
	return {
		event: "UPDATE" as const,
		schema: "public",
		table: "sessions",
		filter: `id=eq.${sessionId}`,
	};
}

export function useRoomRealtime(sessionId: string) {
	const router = useRouter();

	useEffect(() => {
		const supabase = createClient();
		const refresh = () => startTransition(() => router.refresh());

		const channel = supabase.channel(`room:${sessionId}`);
		for (const table of ROOM_PARTICIPANT_TABLES) {
			channel.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table,
					filter: `session_id=eq.${sessionId}`,
				},
				refresh,
			);
		}
		channel
			.on("postgres_changes", roomSessionChangeFilter(sessionId), refresh)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [sessionId, router]);
}
