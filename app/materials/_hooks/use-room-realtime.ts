"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import {
	pickLatestRoomFrame,
	roomChannelIsLive,
	roomRefreshIntervalMs,
	shouldRefetchOnChannelStatus,
	shouldRefetchOnVisibility,
} from "@/app/materials/_lib/room-sync";
import { createClient } from "@/lib/supabase/client";

/**
 * Única interfaz de sincronización de la Sala (`room-sync`): este hook solo
 * suscribe el canal realtime y refresca; las mutaciones van por
 * `useRoomMutation` / `useRunAction`, que resuelven por el mismo seam.
 */

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
	"votes",
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

/**
 * Conserva el snapshot más nuevo cuando dos `router.refresh()` se pisan:
 * un RSC que salió antes no puede devolver la Sala a una Etapa anterior.
 */
export function useLatestSnapshot<T extends { asOf: number }>(incoming: T): T {
	const [held, setHeld] = useState(incoming);
	const next = pickLatestRoomFrame(held, incoming);
	if (next !== held) setHeld(next);
	return next;
}

export function useRoomRealtime(sessionId: string): { live: boolean } {
	const router = useRouter();
	const [live, setLive] = useState(true);
	const [joined, setJoined] = useState(false);
	const previousStatus = useRef<string | null>(null);

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
			.subscribe((status) => {
				setLive(roomChannelIsLive(status));
				if (status === "SUBSCRIBED") setJoined(true);
				if (shouldRefetchOnChannelStatus(status, previousStatus.current)) {
					refresh();
				}
				previousStatus.current = status;
			});

		const onVisibility = () => {
			if (shouldRefetchOnVisibility(document.visibilityState)) refresh();
		};
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			document.removeEventListener("visibilitychange", onVisibility);
			supabase.removeChannel(channel);
		};
	}, [sessionId, router]);

	useEffect(() => {
		const ms = roomRefreshIntervalMs(joined, live);
		const id = window.setInterval(() => {
			startTransition(() => router.refresh());
		}, ms);
		return () => window.clearInterval(id);
	}, [joined, live, router]);

	return { live };
}
