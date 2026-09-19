// Maestría: cálculo derivado por Categoría (issues #59/#61).
// Sin tabla propia: 1 punto por participar en una Sesión de la categoría
// + 1 por aportar en ella (pregunta, exposición/complemento o trivia).
// Umbrales 3/8/15. Pura: la usan servidor y cliente.

export const MASTERY_LEVELS = [
	{ min: 0, name: "Semilla" },
	{ min: 3, name: "Degustador" },
	{ min: 8, name: "Contertulio" },
	{ min: 15, name: "Maestro" },
] as const;

export type MasteryLevelName = (typeof MASTERY_LEVELS)[number]["name"];

export type MasteryProgress = {
	level: MasteryLevelName;
	next: number | null;
	points: number;
	pct: number;
};

/** Puntos de categoría: participar suma 1, aportar suma 1 más. */
export function masteryPoints(input: {
	participated: boolean;
	contributed: boolean;
}): number {
	if (!input.participated) return 0;
	return input.contributed ? 2 : 1;
}

export function masteryLevelFor(points: number): MasteryLevelName {
	let level: MasteryLevelName = "Semilla";
	for (const step of MASTERY_LEVELS) {
		if (points >= step.min) level = step.name;
	}
	return level;
}

export function masteryProgress(points: number): MasteryProgress {
	const level = masteryLevelFor(points);
	const index = MASTERY_LEVELS.findIndex((step) => step.name === level);
	const next =
		index + 1 < MASTERY_LEVELS.length ? MASTERY_LEVELS[index + 1].min : null;
	return {
		level,
		next,
		points,
		pct: next === null ? 100 : Math.min(100, Math.round((points / next) * 100)),
	};
}

export type MasteryEvent = {
	categoryId: string;
	participated: boolean;
	contributed: boolean;
};

/**
 * Agrega eventos (sesión × categoría) a puntos por categoría.
 * Una sola fuente para la regla 1+1 (ver masteryPoints).
 */
export function aggregateMastery(events: MasteryEvent[]): Map<string, number> {
	const points = new Map<string, number>();
	for (const event of events) {
		if (!event.participated) continue;
		points.set(
			event.categoryId,
			(points.get(event.categoryId) ?? 0) + masteryPoints(event),
		);
	}
	return points;
}
