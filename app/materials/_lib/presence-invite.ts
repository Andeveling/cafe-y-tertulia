/**
 * Candidatos a invitar desde Presentes: Miembros activos menos los ya
 * presentes, ordenados llamables primero. Delega la regla de Llamar en
 * Convocatoria (ADR 0010).
 */

import { resuelveConvocatoria } from "@/app/_lib/convocatoria";
import type { EstadoPresencia } from "@/lib/presencia/estado";

export type InviteRosterMember = {
	id: string;
	display_name: string;
	/** Src del catálogo (`members.avatar`) o null = iniciales. */
	avatar?: string | null;
};

export type InviteCandidate = {
	id: string;
	displayName: string;
	/** Compat: vivo (en_linea, en_sesion o ausente). */
	online: boolean;
	/** Estado de presencia detallado. */
	estado: EstadoPresencia;
	/** Acepta Convocatoria: solo En línea y Ausente (ADR 0010). */
	llamable: boolean;
	pending: boolean;
	/** En sesión: etiqueta, sin botón. */
	enOtraSala: boolean;
};

const ORDEN_INVITE: Record<EstadoPresencia, number> = {
	en_linea: 0,
	ausente: 1,
	en_sesion: 2,
	desconectado: 3,
};

export function buildInviteCandidates(args: {
	roster: InviteRosterMember[];
	onlineIds: Set<string> | string[];
	participantIds: Set<string> | string[];
	pendingIds?: Set<string> | string[];
	selfId?: string | null;
	estados?: Record<string, EstadoPresencia> | Map<string, EstadoPresencia>;
}): InviteCandidate[] {
	const online =
		args.onlineIds instanceof Set ? args.onlineIds : new Set(args.onlineIds);
	const participants =
		args.participantIds instanceof Set
			? args.participantIds
			: new Set(args.participantIds);

	const estadoDe = (id: string): EstadoPresencia => {
		if (args.estados) {
			if (args.estados instanceof Map)
				return args.estados.get(id) ?? "desconectado";
			return args.estados[id] ?? "desconectado";
		}
		return online.has(id) ? "en_linea" : "desconectado";
	};

	const roster = args.roster
		.filter((m) => !participants.has(m.id))
		.map((m) => ({
			id: m.id,
			display_name: m.display_name,
			estado: estadoDe(m.id),
		}));

	const filas = resuelveConvocatoria({
		roster,
		pendingIds: args.pendingIds,
		selfId: args.selfId,
	});

	return [...filas]
		.sort((a, b) => {
			if (a.estado !== b.estado)
				return ORDEN_INVITE[a.estado] - ORDEN_INVITE[b.estado];
			return a.displayName.localeCompare(b.displayName);
		})
		.map((f) => ({
			id: f.id,
			displayName: f.displayName,
			online: f.estado !== "desconectado",
			estado: f.estado,
			llamable: f.llamable,
			pending: f.pending,
			enOtraSala: f.enOtraSala,
		}));
}
