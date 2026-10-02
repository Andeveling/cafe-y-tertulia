/**
 * Prototipo throwaway — /library (Mi biblioteca).
 * Pregunta: el form largo arriba empuja la colección abajo y las
 * cards pequeñas no invitan a repasar. ¿Qué estructura lo hace
 * hojeable sin perder el guardado rápido?
 * No muta datos reales. Sin tests, sin persistencia.
 */

import type { MaterialKind } from "@/app/materials/_lib/constants";

export type ProtoBibliotecaItem = {
	id: string;
	title: string;
	author: string;
	kind: MaterialKind;
	motive: string | null;
	imageUrl: string | null;
	createdAt: string;
};

export const INITIAL: ProtoBibliotecaItem[] = [
	{
		id: "proto-1",
		title: "El nombre del viento",
		author: "Patrick Rothfuss",
		kind: "book",
		motive: "Lo propone siempre Lucía y nunca lo llevamos. Ideal para debate de personajes.",
		imageUrl: null,
		createdAt: "2026-09-20",
	},
	{
		id: "proto-2",
		title: "El hilo invisible",
		author: "Sonia Valiente",
		kind: "podcast",
		motive: "Episodio de 40 min sobre rituales de lectura. Digno de una previa corta.",
		imageUrl: null,
		createdAt: "2026-09-22",
	},
	{
		id: "proto-3",
		title: "Cómo sostener una conversación difícil",
		author: "Café Conjurado",
		kind: "video",
		motive: null,
		imageUrl: null,
		createdAt: "2026-09-24",
	},
	{
		id: "proto-4",
		title: "La biblioteca de medianoche",
		author: "Matt Haig",
		kind: "book",
		motive: "Corto, amable, con pregunta final obvia para sorteo.",
		imageUrl: null,
		createdAt: "2026-09-25",
	},
	{
		id: "proto-5",
		title: "El arte de no terminar los libros",
		author: "Revista Lectura",
		kind: "article",
		motive: "Artículo de 8 min. Bueno para romper el hielo si alguien no leyó.",
		imageUrl: null,
		createdAt: "2026-09-26",
	},
	{
		id: "proto-6",
		title: "Sonido y tertulia",
		author: "El Sótano",
		kind: "podcast",
		motive: null,
		imageUrl: null,
		createdAt: "2026-09-27",
	},
];
