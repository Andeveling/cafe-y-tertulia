/**
 * Mínimo para salir de Preguntas: al menos dos miembros, cada uno con
 * una pregunta. Cero personas no es "todos tienen pregunta".
 */
export const MIN_READY_TO_LEAVE_QUESTIONS = 2;

type Seat = {
	memberId: string;
	role: "member" | "spectator";
	optOut: boolean;
};

export type QuestionsAdvance = {
	readyCount: number;
	missingCount: number;
	missingIds: string[];
	canAdvance: boolean;
	headline: string;
};

export function questionsAdvance(input: {
	participants: Seat[];
	questionAuthorIds: Iterable<string>;
}): QuestionsAdvance {
	const authors = new Set(input.questionAuthorIds);
	const members = input.participants.filter(
		(p) => p.role === "member" && !p.optOut,
	);
	const missingIds = members
		.filter((p) => !authors.has(p.memberId))
		.map((p) => p.memberId);
	const readyCount = members.length - missingIds.length;
	const canAdvance = readyCount >= MIN_READY_TO_LEAVE_QUESTIONS;

	let headline: string;
	if (!canAdvance) {
		headline =
			readyCount === 0
				? "Nadie tiene pregunta. Hacen falta al menos 2."
				: `Hay ${readyCount} con pregunta. Hacen falta al menos 2.`;
	} else if (missingIds.length > 0) {
		headline = `Faltan ${missingIds.length}: ¿esperamos o entran mirando?`;
	} else {
		headline = "Todos tienen pregunta.";
	}

	return {
		readyCount,
		missingCount: missingIds.length,
		missingIds,
		canAdvance,
		headline,
	};
}
