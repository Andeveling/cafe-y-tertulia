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
	/** Src del catálogo (`members.avatar`) o null = iniciales. */
	avatar?: string | null;
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

const TOPIC = "club-roster";

/**
 * Canal de presencia por grupo (PRD #69): dentro del grupo A solo se ve
 * presencia de A. Sin grupo se mantiene el canal histórico del club.
 */
export function presenceTopic(groupId: string | undefined): string {
	return groupId ? `group-${groupId}-roster` : TOPIC;
}

type BrowserSupabase = ReturnType<typeof createClient>;
type RosterChannel = ReturnType<BrowserSupabase["channel"]>;
type RosterState = Record<string, TrackPayload[]>;
type RosterListener = (state: RosterState) => void;

type SharedRoster = {
	supabase: BrowserSupabase;
	channel: RosterChannel;
	topic: string;
	userId: string;
	salaId: string | undefined;
	refs: number;
	listeners: Set<RosterListener>;
	heartbeat: ReturnType<typeof setInterval> | undefined;
};

/**
 * Sesión compartida del canal `club-roster` (una por vida de la página).
 *
 * El cliente de Supabase del navegador es singleton y
 * `supabase.channel(topic)` devuelve el MISMO objeto mientras viva la página.
 * Además `RealtimeChannel.on("presence")` lanza si el canal ya hizo
 * `subscribe()`, y `removeChannel()` destruye sus callbacks de forma
 * irreversible. Por eso el canal se cablea UNA vez y se comparte por
 * referencia entre todas las instancias del hook (p. ej. `StartBoard` monta
 * dos `ClubRoster` a la vez, y StrictMode re-monta en desarrollo).
 */
let shared: SharedRoster | null = null;

function readRosterState(s: SharedRoster): RosterState {
	try {
		return (s.channel.presenceState<TrackPayload>() ?? {}) as RosterState;
	} catch {
		return {};
	}
}

function dispatchRoster(): void {
	if (!shared) return;
	const state = readRosterState(shared);
	for (const listener of shared.listeners) listener(state);
}

function trackOwn(s: SharedRoster): void {
	// Seguro antes de SUBSCRIBED: Phoenix encola el push hasta el join.
	try {
		void Promise.resolve(
			s.channel.track({
				user_id: s.userId,
				last_active: Date.now(),
				session_id: s.salaId ?? null,
			} satisfies TrackPayload),
		).catch(() => {
			// Presencia es best-effort: nunca rompe la app.
		});
	} catch {
		// Presencia es best-effort: nunca rompe la app.
	}
}

async function persistLastSeen(s: SharedRoster): Promise<void> {
	try {
		await s.supabase
			.from("members")
			.update({ last_seen: new Date().toISOString() })
			.eq("id", s.userId);
	} catch {
		// Presencia es best-effort: nunca rompe la app.
	}
}

function startHeartbeat(s: SharedRoster): void {
	if (s.heartbeat) clearInterval(s.heartbeat);
	s.heartbeat = setInterval(() => {
		if (shared !== s) {
			if (s.heartbeat) clearInterval(s.heartbeat);
			s.heartbeat = undefined;
			return;
		}
		void persistLastSeen(s);
		// Refresca mi last_active para que otros calculen Ausente, y
		// re-anuncia presencia si un re-join quedó a medias.
		trackOwn(s);
	}, HEARTBEAT_MS);
}

/** Apaga una sesión sin destruir el canal (sus callbacks no se pueden re-registrar). */
function teardownRoster(s: SharedRoster): void {
	if (s.heartbeat) {
		clearInterval(s.heartbeat);
		s.heartbeat = undefined;
	}
	// Sin `removeChannel()` a propósito: hace `teardown()` y vacía los
	// callbacks de presencia del objeto, dejando el topic inservible de por
	// vida en la página. `unsubscribe()` conserva los bindings y permite
	// re-suscribir el mismo objeto.
	void (async () => {
		try {
			await s.channel.untrack();
		} catch {
			// Presencia es best-effort: nunca rompe la app.
		}
		try {
			await s.channel.unsubscribe();
		} catch {
			// Presencia es best-effort: nunca rompe la app.
		}
	})();
}

function releaseRoster(s: SharedRoster, listener: RosterListener): void {
	s.listeners.delete(listener);
	if (shared !== s) return; // Ya reemplazada (cambio de usuario): nada que apagar.
	s.refs = Math.max(0, s.refs - 1);
	if (s.refs > 0) return;
	shared = null;
	teardownRoster(s);
}

function acquireRoster(
	userId: string,
	salaId: string | undefined,
	listener: RosterListener,
	groupId: string | undefined,
): () => void {
	const topic = presenceTopic(groupId);
	if (shared && (shared.userId !== userId || shared.topic !== topic)) {
		// Cambio de usuario o de grupo sin desmontaje intermedio: suelta la
		// sesión anterior (cada grupo tiene su propio canal).
		const stale = shared;
		shared = null;
		stale.listeners.clear();
		teardownRoster(stale);
	}
	if (!shared) {
		const supabase = createClient();
		const channel = supabase.channel(topic, {
			config: { presence: { key: userId } },
		});
		const s: SharedRoster = {
			supabase,
			channel,
			topic,
			userId,
			salaId,
			refs: 0,
			listeners: new Set(),
			heartbeat: undefined,
		};
		shared = s;
		if (!channel.joinedOnce) {
			// Los callbacks de presencia solo se pueden registrar una vez por
			// objeto canal: las siguientes sesiones reutilizan estos mismos
			// (sobreviven a `unsubscribe`, que nunca hace `teardown` aquí).
			channel.on("presence", { event: "sync" }, dispatchRoster);
			channel.on("presence", { event: "join" }, dispatchRoster);
			channel.on("presence", { event: "leave" }, dispatchRoster);
		}
		// `subscribe()` sin join pendiente es no-op, así que es seguro
		// llamarlo en cada adquisición; el heartbeat inmediato cubre el caso
		// en que el callback SUBSCRIBED no llegue a esta sesión.
		channel.subscribe((status) => {
			if (status !== "SUBSCRIBED" || shared !== s) return;
			trackOwn(s);
			dispatchRoster();
			void persistLastSeen(s);
			startHeartbeat(s);
		});
		trackOwn(s);
		dispatchRoster();
		void persistLastSeen(s);
		startHeartbeat(s);
	} else {
		shared.salaId = salaId;
		// Sesión ya viva (o uniéndose): anuncia mi sala actual y entrega el
		// estado conocido sin re-suscribir.
		trackOwn(shared);
		dispatchRoster();
	}
	const s = shared;
	s.refs += 1;
	s.listeners.add(listener);
	listener(readRosterState(s));
	return () => releaseRoster(s, listener);
}

/**
 * Presencia híbrida (ADR 0010): canal vivo + `last_seen` persistido.
 * Una key por Miembro (multi-pestaña colapsa). Escucha sync+join+leave,
 * gracia offline 90 s, Ausente a 5 min fuera de Sala (en Sala nunca ausente).
 *
 * Con `opts.groupId` el canal es `group-{id}-roster` (PRD #69): dentro del
 * grupo A solo se ve presencia de A. Sin grupo, canal histórico `club-roster`.
 *
 * El canal subyacente se comparte entre todas las instancias montadas a la
 * vez; desmontar la última solo hace `untrack`+`unsubscribe`, nunca
 * `removeChannel`, para poder re-suscribir al volver.
 */
export function useClubPresence(
	userId: string | undefined,
	members: RosterMember[],
	opts?: { salaId?: string; groupId?: string },
): PresenceRosterMember[] {
	const salaId = opts?.salaId;
	const groupId = opts?.groupId;
	const [tracks, setTracks] = useState<Record<string, TrackPayload[]>>({});
	const [, setUltimaActividadPropia] = useState(() => Date.now());
	const [ahora, setAhora] = useState(() => Date.now());

	useEffect(() => {
		if (!userId) return;
		const release = acquireRoster(userId, salaId, setTracks, groupId);
		const ticker = setInterval(() => setAhora(Date.now()), 15_000);

		// Actividad propia: resetea Ausente (throttle 10 s) fuera y dentro de sala.
		let ultimoEnvio = 0;
		const actividad = () => {
			const t = Date.now();
			setUltimaActividadPropia(t);
			if (t - ultimoEnvio < 10_000) return;
			ultimoEnvio = t;
			if (shared?.userId === userId) trackOwn(shared);
		};
		const eventos = ["pointermove", "keydown", "scroll", "click"] as const;
		for (const e of eventos)
			window.addEventListener(e, actividad, { passive: true });

		return () => {
			for (const e of eventos) window.removeEventListener(e, actividad);
			clearInterval(ticker);
			release();
		};
	}, [userId, salaId, groupId]);

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
