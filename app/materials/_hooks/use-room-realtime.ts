"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import {
	applyLatest,
	createSalaSync,
	roomChannelIsLive,
	roomRefreshIntervalMs,
	shouldRefetchOnChannelStatus,
	shouldRefetchOnVisibility,
} from "@/app/materials/_lib/room-sync";
import { createClient } from "@/lib/supabase/client";

/**
 * Adapter de suscripción de la Sala (`createSalaSync.subscribe` +
 * apply-latest). Las mutaciones van por `useRoomMutation` (mismo módulo).
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
	"hearts",
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
	const next = applyLatest(held, incoming);
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
		// La ráfaga del Sorteo (INSERT en draws + N en assignments) colapsa
		// en un solo refresh: N+1 round-trips solapados rompían la página.
		const observer = createSalaSync({ refresh }).subscribe();
		const scheduleRefresh = () => observer.notify();

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
				scheduleRefresh,
			);
		}
		channel
			.on(
				"postgres_changes",
				roomSessionChangeFilter(sessionId),
				scheduleRefresh,
			)
			.on("broadcast", { event: "member_left" }, scheduleRefresh)
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
			observer.unsubscribe();
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

/**
 * Avisa a la Sala ya suscrita de que alguien se fue, sin refrescar la
 * página del que sale: ese refresh la volvería a sentar (`seatIfAbsent`).
 */
export async function announceMemberLeft(sessionId: string) {
	try {
		await createClient()
			.channel(`room:${sessionId}`)
			.send({ type: "broadcast", event: "member_left", payload: {} });
	} catch {
		// El heartbeat de la Sala cubre el fallo.
	}
}
