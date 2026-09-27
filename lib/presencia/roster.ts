import {
	type EstadoPresencia,
	formateaUltimaVez,
	ordenaPorEstado,
	resuelveEstado,
	UMBRAL_DESCONECTADO_MS,
} from "@/lib/presencia/estado";

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

export type PresenceTrack = {
	last_active: number;
	session_id?: string | null;
};

function toMs(iso: string | null | undefined): number | null {
	if (!iso) return null;
	const t = Date.parse(iso);
	return Number.isNaN(t) ? null : t;
}

/**
 * Derivación del roster: miembros + tracks del canal → roster ordenado con
 * estado y conteo. Pura y testeable sin canal ni reloj. Con grupo, el canal
 * group-{id}-roster es la única fuente (el last_seen global delataría
 * actividad en otros grupos); sin grupo vale la gracia de last_seen.
 */
export function buildRoster(args: {
	members: RosterMember[];
	tracks: Record<string, PresenceTrack[]>;
	ahora: number;
	groupId?: string;
	salaId?: string;
}): PresenceRosterMember[] {
	const { members, tracks, ahora, groupId, salaId } = args;
	const base = members.map((m) => {
		const payload = tracks[m.id]?.[0];
		const lastSeenDb = toMs(m.last_seen);
		const isGroupScoped = groupId != null;
		let ultimaVez: number | null;
		let vivo: boolean;
		if (payload) {
			ultimaVez = payload.last_active;
			vivo = true;
		} else if (isGroupScoped) {
			ultimaVez = null;
			vivo = false;
		} else {
			ultimaVez = lastSeenDb;
			vivo = lastSeenDb !== null && ahora - lastSeenDb < UMBRAL_DESCONECTADO_MS;
		}
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

/** En línea del roster: un solo conteo para todas las vistas. */
export function countOnline(
	roster: Pick<PresenceRosterMember, "online">[],
): number {
	return roster.filter((m) => m.online).length;
}
