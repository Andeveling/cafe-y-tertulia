/**
 * Candidatos a invitar desde Presentes: Miembros activos menos los ya
 * presentes, ordenados llamables primero. Puro y testeable sin React.
 */

import { type EstadoPresencia, puedeLlamar } from "@/lib/presencia/estado";

export type InviteRosterMember = {
	id: string;
	display_name: string;
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
	const pending = args.pendingIds
		? args.pendingIds instanceof Set
			? args.pendingIds
			: new Set(args.pendingIds)
		: new Set<string>();

	const estadoDe = (id: string): EstadoPresencia => {
		if (args.estados) {
			if (args.estados instanceof Map)
				return args.estados.get(id) ?? "desconectado";
			return args.estados[id] ?? "desconectado";
		}
		return online.has(id) ? "en_linea" : "desconectado";
	};

	const out: InviteCandidate[] = [];
	for (const m of args.roster) {
		if (args.selfId && m.id === args.selfId) continue;
		if (participants.has(m.id)) continue;
		const estado = estadoDe(m.id);
		out.push({
			id: m.id,
			displayName: m.display_name,
			online: estado !== "desconectado",
			estado,
			llamable: puedeLlamar(estado),
			pending: pending.has(m.id),
		});
	}

	out.sort((a, b) => {
		if (a.estado !== b.estado)
			return ORDEN_INVITE[a.estado] - ORDEN_INVITE[b.estado];
		return a.displayName.localeCompare(b.displayName);
	});
	return out;
}
