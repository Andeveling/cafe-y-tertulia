"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Adaptador realtime del reloj del Sorteo. El INSERT en `draws` trae
 * `created_at` en el payload, así el countdown arranca en ~200 ms sin
 * esperar al snapshot (1-3 s se comía el 3-2-1).
 *
 * Devuelve el reloj autoritativo del snapshot cuando ya llegó, si no el del
 * evento. La asamblea (`assembleDrawCeremony`) congela reveal/settled hasta
 * que existan Asignaciones.
 */
export function useDrawClock(
	sessionId: string,
	authoritativeCreatedAt: string | null,
	listen: boolean,
): string | null {
	const [eventT0, setEventT0] = useState<string | null>(null);

	useEffect(() => {
		setEventT0(null);
		if (!listen || authoritativeCreatedAt) return;
		const supabase = createClient();
		const channel = supabase
			.channel(`draw-clock:${sessionId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "draws",
					filter: `session_id=eq.${sessionId}`,
				},
				(payload) => {
					const createdAt = (payload.new as { created_at?: unknown })
						?.created_at;
					if (typeof createdAt === "string" && createdAt.length > 0) {
						setEventT0(createdAt);
					}
				},
			)
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [sessionId, authoritativeCreatedAt, listen]);

	return authoritativeCreatedAt ?? eventT0;
}
