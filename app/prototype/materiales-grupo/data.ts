/**
 * PROTOTYPE throwaway — vista Materiales del grupo (/g/[slug]/materials).
 * Pregunta: la vista actual se lee como dashboard (card pequeña + caja
 * "Postulados" con filas anidadas) y no como ritual. ¿Qué estructura le
 * devuelve calma editorial sin perder sorteo/pacto ni postulación 1×formato?
 * Tres variantes en /prototype/materiales-grupo?variant= — estado en memoria.
 */

export type ProtoMaterial = {
	id: string;
	title: string;
	author: string;
	kind: "Libro" | "Podcast" | "Video" | "Artículo";
	status: "En curso" | "Propuesto" | "Terminado";
	sessions: number;
	rating: number | null;
	initial: string;
};

export type ProtoCandidate = {
	id: string;
	title: string;
	author: string;
	kind: "Libro" | "Podcast" | "Video" | "Artículo";
	quotaBlocked: string | null;
	mine: boolean;
};

export const GROUP_NAME = "nojau";

export const CURRENT: ProtoMaterial = {
	id: "cien-anos",
	title: "Cien años de soledad",
	author: "G. García Márquez",
	kind: "Libro",
	status: "En curso",
	sessions: 2,
	rating: null,
	initial: "C",
};

export const HISTORY: ProtoMaterial[] = [
	{
		id: "h1",
		title: "Los detectives salvajes",
		author: "R. Bolaño",
		kind: "Libro",
		status: "Terminado",
		sessions: 4,
		rating: 4.5,
		initial: "L",
	},
	{
		id: "h2",
		title: "El arte de conversar",
		author: "Radio Ambulante",
		kind: "Podcast",
		status: "Terminado",
		sessions: 1,
		rating: 4,
		initial: "E",
	},
];

export const CANDIDATES: ProtoCandidate[] = [
	{
		id: "c1",
		title: "El Arte de Gastar Dinero",
		author: "Luis Ramos · Morgan Housel",
		kind: "Podcast",
		quotaBlocked: null,
		mine: false,
	},
	{
		id: "c2",
		title: "La península de las casas vacías",
		author: "David Uclés",
		kind: "Libro",
		quotaBlocked: "Ya postulaste 1 libro",
		mine: true,
	},
];
