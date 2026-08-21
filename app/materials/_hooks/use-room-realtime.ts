"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscripción realtime para la Sala: escucha cambios en
 * session_participants, questions, draws y assignments.
 * Cada cambio dispara router.refresh() para re-fetch del snapshot.
 */
export function useRoomRealtime(sessionId: string) {
	const router = useRouter();

	useEffect(() => {
		const supabase = createClient();

		const channel = supabase
			.channel(`room:${sessionId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "session_participants",
					filter: `session_id=eq.${sessionId}`,
				},
				() => router.refresh(),
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "questions",
					filter: `session_id=eq.${sessionId}`,
				},
				() => router.refresh(),
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "draws",
					filter: `session_id=eq.${sessionId}`,
				},
				() => router.refresh(),
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "assignments",
					filter: `session_id=eq.${sessionId}`,
				},
				() => router.refresh(),
			)
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
