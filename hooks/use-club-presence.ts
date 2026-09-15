"use client";

import { useEffect, useState } from "react";
import {
	type EstadoPresencia,
	formateaUltimaVez,
	HEARTBEAT_MS,
	ordenaPorEstado,
	resuelveEstado,
	UMBRAL_DESCONECTADO_MS,
} from "@/lib/presencia/estado";
import { createClient } from "@/lib/supabase/client";

export type RosterMember = {
	id: string;
	display_name: string;
	last_seen?: string | null;
};

export type PresenceRosterMember = RosterMember & {
	estado: EstadoPresencia;
	/** ms epoch de última vez conocida (presence o last_seen). */
	ultimaVez: number | null;
	/** Etiqueta lista para UI (“ahora mismo”, “hace 5 min”). */
	ultimaVezTexto: string;
	/** True si está en una sala distinta a la mía (o en alguna sala desde home). */
	enOtraSala: boolean;
	/** Compat: vivo en Presence (dentro de gracia). */
	online: boolean;
};

type TrackPayload = {
	user_id: string;
	last_active: number;
	session_id?: string | null;
};

function toMs(iso: string | null | undefined): number | null {
	if (!iso) return null;
	const t = Date.parse(iso);
	return Number.isNaN(t) ? null : t;
}

/**
 * Presencia híbrida (ADR 0010): `club-roster` vivo + `last_seen` persistido.
 * Una key por Miembro (multi-pestaña colapsa). Escucha sync+join+leave,
 * gracia offline 90 s, Ausente a 5 min fuera de Sala (en Sala nunca ausente).
 */
export function useClubPresence(
	userId: string | undefined,
	members: RosterMember[],
	opts?: { salaId?: string },
): PresenceRosterMember[] {
	const salaId = opts?.salaId;
	const [tracks, setTracks] = useState<Record<string, TrackPayload[]>>({});
	const [, setUltimaActividadPropia] = useState(() => Date.now());
	const [ahora, setAhora] = useState(() => Date.now());

	useEffect(() => {
		if (!userId) return;
		const supabase = createClient();
		const channel = supabase.channel("club-roster", {
			config: { presence: { key: userId } },
		});

		const relee = () => {
			const state = channel.presenceState<TrackPayload>();
			setTracks(state as Record<string, TrackPayload[]>);
		};
		channel.on("presence", { event: "sync" }, relee);
		channel.on("presence", { event: "join" }, relee);
		channel.on("presence", { event: "leave" }, relee);

		let heartbeat: ReturnType<typeof setInterval> | undefined;
		let ticker: ReturnType<typeof setInterval> | undefined;

		channel.subscribe(async (status) => {
			if (status !== "SUBSCRIBED") return;
			const marca = Date.now();
			setUltimaActividadPropia(marca);
			await channel.track({
				user_id: userId,
				last_active: marca,
				session_id: salaId ?? null,
			} satisfies TrackPayload);
			relee();

			// Heartbeat last_seen 30 s (throttled, fire-and-forget).
			const late = async () => {
				try {
					await supabase
						.from("members")
						.update({ last_seen: new Date().toISOString() })
						.eq("id", userId);
				} catch {
					// Presencia es best-effort: nunca rompe la app.
				}
			};
			void late();
			heartbeat = setInterval(() => {
				void late();
				// Refresca mi last_active para que otros calculen Ausente.
				void channel.track({
					user_id: userId,
					last_active: Date.now(),
					session_id: salaId ?? null,
				} satisfies TrackPayload);
			}, HEARTBEAT_MS);
			ticker = setInterval(() => setAhora(Date.now()), 15_000);
		});

		// Actividad propia: resetea Ausente (throttle 10 s) fuera y dentro de sala.
		let ultimoEnvio = 0;
		const actividad = () => {
			const t = Date.now();
			setUltimaActividadPropia(t);
			if (t - ultimoEnvio < 10_000) return;
			ultimoEnvio = t;
			void channel.track({
				user_id: userId,
				last_active: t,
				session_id: salaId ?? null,
			} satisfies TrackPayload);
		};
		const eventos = ["pointermove", "keydown", "scroll", "click"] as const;
		for (const e of eventos)
			window.addEventListener(e, actividad, { passive: true });

		return () => {
			for (const e of eventos) window.removeEventListener(e, actividad);
			if (heartbeat) clearInterval(heartbeat);
			if (ticker) clearInterval(ticker);
			void channel.untrack().finally(() => {
				channel.unsubscribe();
				supabase.removeChannel(channel);
			});
		};
	}, [userId, salaId]);

	const base = members.map((m) => {
		const payload = tracks[m.id]?.[0];
		const lastSeenDb = toMs(m.last_seen);
		const ultimaVez = payload ? payload.last_active : lastSeenDb;
		// Gracia: sin payload pero con last_seen fresco (<90 s) sigue vivo.
		const vivo =
			!!payload ||
			(lastSeenDb !== null && ahora - lastSeenDb < UMBRAL_DESCONECTADO_MS);
		const otraSalaId =
			typeof payload?.session_id === "string" ? payload.session_id : null;
		const enSala = otraSalaId !== null;
		const estado = resuelveEstado({
			vivo,
			enSala,
			ultimaActividad: payload?.last_active ?? lastSeenDb ?? 0,
			ahora,
		});
		return {
			...m,
			estado,
			ultimaVez,
			ultimaVezTexto: formateaUltimaVez(ultimaVez, ahora),
			enOtraSala: salaId ? enSala && otraSalaId !== salaId : enSala,
			online: vivo,
		};
	});

	return ordenaPorEstado(base);
}
