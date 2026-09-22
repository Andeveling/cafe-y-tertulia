/**
 * Prototipo throwaway — composición de Sala (room/sala unificada).
 * Pregunta: ¿cómo se muestran los participantes (quién entró, estados)
 * con una sola composición Avatar + primer nombre, en vez de 4 formatos?
 * No muta datos reales. Sin tests, sin persistencia.
 */

import type { EstadoPresencia } from "@/lib/presencia/estado";

export type ProtoSalaMember = {
	id: string;
	displayName: string;
	avatar: string | null;
	/** En la Sala (false = fuera, convocable si online). */
	inRoom: boolean;
	online: boolean;
	estado: EstadoPresencia;
	role: "member" | "spectator";
	hasQuestion: boolean;
	optOut: boolean;
	isModerator: boolean;
	isYou: boolean;
};

export const INITIAL: ProtoSalaMember[] = [
	{
		id: "u-andres",
		displayName: "Andrés Parra",
		avatar: "/avatars/Avatar01.svg",
		inRoom: true,
		online: true,
		estado: "en_sesion",
		role: "member",
		hasQuestion: true,
		optOut: false,
		isModerator: true,
		isYou: true,
	},
	{
		id: "u-bruno",
		displayName: "Bruno Díaz",
		avatar: "/avatars/Avatar05.svg",
		inRoom: true,
		online: true,
		estado: "en_sesion",
		role: "member",
		hasQuestion: false,
		optOut: false,
		isModerator: false,
		isYou: false,
	},
	{
		id: "u-carla",
		displayName: "Carla Méndez",
		avatar: null,
		inRoom: true,
		online: true,
		estado: "en_sesion",
		role: "member",
		hasQuestion: true,
		optOut: false,
		isModerator: false,
		isYou: false,
	},
	{
		id: "u-jose",
		displayName: "José Luis Perales",
		avatar: "/avatars/Avatar08.svg",
		inRoom: true,
		online: true,
		estado: "en_sesion",
		role: "spectator",
		hasQuestion: false,
		optOut: false,
		isModerator: false,
		isYou: false,
	},
	{
		id: "u-lucia",
		displayName: "Lucía Vega",
		avatar: "/avatars/Avatar11.svg",
		inRoom: false,
		online: true,
		estado: "en_linea",
		role: "member",
		hasQuestion: true,
		optOut: false,
		isModerator: false,
		isYou: false,
	},
	{
		id: "u-marta",
		displayName: "Marta",
		avatar: "/avatars/Avatar14.svg",
		inRoom: false,
		online: false,
		estado: "ausente",
		role: "member",
		hasQuestion: false,
		optOut: false,
		isModerator: false,
		isYou: false,
	},
	{
		id: "u-diego",
		displayName: "Diego Sosa",
		avatar: null,
		inRoom: false,
		online: false,
		estado: "desconectado",
		role: "member",
		hasQuestion: false,
		optOut: true,
		isModerator: false,
		isYou: false,
	},
];

/**
 * Regla del prototipo: si el nombre es compuesto (con espacios),
 * se muestra solo el primer nombre. "Andrés Parra" → "Andrés".
 * El nombre completo queda en `title` / tooltip para accesibilidad.
 */
export function firstName(displayName: string): string {
	const trimmed = displayName.trim();
	if (!trimmed) return "Miembro";
	return trimmed.split(/\s+/)[0];
}

/** Listos: en sala, miembro, con pregunta. */
export function isReady(m: ProtoSalaMember): boolean {
	return m.inRoom && m.role === "member" && m.hasQuestion;
}

/** Convocables: online pero fuera de la Sala. */
export function convocable(members: ProtoSalaMember[]): ProtoSalaMember[] {
	return members.filter((m) => m.online && !m.inRoom);
}
