"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Tablas por-participante que refrescan la Sala al cambiar. La bandeja del
 * Debate (ticket #31) añade trivia_rounds y takes a las etapas anteriores.
 */
const ROOM_TABLES = [
	"session_participants",
	"questions",
	"draws",
	"assignments",
	"trivia_rounds",
	"takes",
] as const;

export function useRoomRealtime(sessionId: string) {
	const router = useRouter();

	useEffect(() => {
		const supabase = createClient();

		const channel = supabase.channel(`room:${sessionId}`);
		for (const table of ROOM_TABLES) {
			channel.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table,
					filter: `session_id=eq.${sessionId}`,
				},
				() => router.refresh(),
			);
		}
		channel
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "sessions",
					filter: `id=eq.${sessionId}`,
				},
				() => router.refresh(),
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [sessionId, router]);
}
