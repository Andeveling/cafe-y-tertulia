/**
 * Emparejamiento del Sorteo (ADR 0001): bipartito aleatorio, sin autoría,
 * máx. 2 asignados por Pregunta, un slot por Participante elegible.
 */

export type DrawParticipant = { memberId: string; optOut: boolean };
export type DrawQuestion = {
	id: string;
	authorId: string;
	outsideDraw: boolean;
};
export type DrawAssignment = {
	questionId: string;
	assigneeId: string;
	revealOrder: number;
};

/** Fisher–Yates; `random` devuelve [0, 1). */
export function shuffle<T>(items: T[], random: () => number): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		const tmp = out[i]!;
		out[i] = out[j]!;
		out[j] = tmp;
	}
	return out;
}

export function matchDraw(input: {
	participants: DrawParticipant[];
	questions: DrawQuestion[];
	random?: () => number;
}): DrawAssignment[] {
	const random = input.random ?? Math.random;
	const people = shuffle(
		input.participants.filter((p) => !p.optOut).map((p) => p.memberId),
		random,
	);
	const pool = shuffle(
		input.questions.filter((q) => !q.outsideDraw),
		random,
	);

	const taken = new Map<string, number>();
	const pairs: { questionId: string; assigneeId: string }[] = [];

	for (const memberId of people) {
		const candidates = pool.filter(
			(q) => q.authorId !== memberId && (taken.get(q.id) ?? 0) < 2,
		);
		if (candidates.length === 0) continue;
		const pick = candidates[Math.floor(random() * candidates.length)]!;
		taken.set(pick.id, (taken.get(pick.id) ?? 0) + 1);
		pairs.push({ questionId: pick.id, assigneeId: memberId });
	}

	return shuffle(pairs, random).map((pair, i) => ({
		...pair,
		revealOrder: i + 1,
	}));
}
