// PROTOTYPE — throwaway, no tests, no persistence. Mock data for /prototype/categorias-maestrias.

import {
	Chat01Icon,
	ClapperboardIcon,
	Coffee01Icon,
	FeatherIcon,
	Idea01Icon,
	LandmarkIcon,
	LaurelWreath01Icon,
	NewspaperIcon,
	SproutIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export const CATEGORIES: { id: string; name: string; icon: IconSvgElement }[] =
	[
		{ id: "filosofia", name: "Filosofía", icon: Idea01Icon },
		{ id: "cine", name: "Cine", icon: ClapperboardIcon },
		{ id: "actualidad", name: "Actualidad", icon: NewspaperIcon },
		{ id: "poesia", name: "Poesía", icon: FeatherIcon },
		{ id: "historia", name: "Historia", icon: LandmarkIcon },
	];

// Umbrales aceptados en #57: 3 / 8 / 15 puntos de categoría.
// Solo HugeIcons, nada de emoji.
export const LEVELS: { min: number; name: string; icon: IconSvgElement }[] = [
	{ min: 0, name: "Semilla", icon: SproutIcon },
	{ min: 3, name: "Degustador", icon: Coffee01Icon },
	{ min: 8, name: "Contertulio", icon: Chat01Icon },
	{ min: 15, name: "Maestro", icon: LaurelWreath01Icon },
];

export function levelFor(points: number): {
	index: number;
	name: string;
	icon: IconSvgElement;
	next: number | null;
} {
	let index = 0;
	for (let i = 0; i < LEVELS.length; i++) {
		if (points >= LEVELS[i].min) index = i;
	}
	const next = index + 1 < LEVELS.length ? LEVELS[index + 1].min : null;
	return { index, name: LEVELS[index].name, icon: LEVELS[index].icon, next };
}

export const MOCK_MATERIAL = {
	title: "1984 — George Orwell",
	status: "en curso",
	categories: ["filosofia", "historia"] as string[],
};

export const MOCK_ME = {
	name: "Andrés",
	// puntos de categoría: participación (1) + bonus por aporte
	points: {
		filosofia: 9,
		cine: 4,
		actualidad: 16,
		poesia: 1,
		historia: 2,
	} as Record<string, number>,
};

export const MOCK_ROSTER = [
	{
		name: "Andrés",
		points: { filosofia: 9, cine: 4, actualidad: 16, poesia: 1, historia: 2 },
	},
	{
		name: "Lucía",
		points: { filosofia: 15, cine: 8, actualidad: 2, poesia: 10, historia: 0 },
	},
	{
		name: "Marco",
		points: { filosofia: 2, cine: 12, actualidad: 5, poesia: 0, historia: 7 },
	},
	{
		name: "Elena",
		points: { filosofia: 5, cine: 1, actualidad: 9, poesia: 4, historia: 11 },
	},
] as { name: string; points: Record<string, number> }[];
