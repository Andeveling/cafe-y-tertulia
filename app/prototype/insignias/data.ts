// Datos de ejemplo para el prototipo — badges del SPEC §6

export type BadgeData = {
	key: string;
	emoji: string;
	name: string;
	description: string;
	kind: "individual" | "collective";
	earned: boolean;
	earnedDate?: string;
	context?: string; // por qué se ganó
};

export const BADGES: BadgeData[] = [
	{
		key: "first_question",
		emoji: "☕",
		name: "Primera pregunta",
		description: "Creaste tu primera pregunta para una sesión",
		kind: "individual",
		earned: true,
		earnedDate: "2026-07-15",
		context: "Sesión #3 — 'Dune'",
	},
	{
		key: "elephant_memory",
		emoji: "🧠",
		name: "Memoria de elefante",
		description: "Ganaste una ronda de trivia",
		kind: "individual",
		earned: true,
		earnedDate: "2026-08-02",
		context: "Trivia en sesión #7",
	},
	{
		key: "perspective_shift",
		emoji: "🔥",
		name: "Cambio de perspectiva",
		description: "El moderador reconoció tu aporte durante el debate",
		kind: "individual",
		earned: true,
		earnedDate: "2026-08-10",
		context: "Otorgada por Ana en sesión #9",
	},
	{
		key: "thought_provoking_question",
		emoji: "🎯",
		name: "Pregunta que hizo pensar",
		description: "Tu pregunta generó un debate profundo",
		kind: "individual",
		earned: false,
	},
	{
		key: "perfect_participation",
		emoji: "⭐",
		name: "Participación perfecta",
		description: "Pregunta + trivia + exposición, sin faltar al cierre",
		kind: "individual",
		earned: false,
	},
	{
		key: "consistent_reader",
		emoji: "📚",
		name: "Lector constante",
		description: "Varias sesiones consecutivas asistidas",
		kind: "individual",
		earned: true,
		earnedDate: "2026-08-14",
		context: "5 sesiones seguidas",
	},
	{
		key: "first_book_finished",
		emoji: "🏆",
		name: "Primer libro terminado",
		description: "El club terminó su primer material",
		kind: "collective",
		earned: true,
		earnedDate: "2026-08-05",
		context: "Dune — Herbert",
	},
	{
		key: "fifty_sessions",
		emoji: "🏆",
		name: "50 sesiones",
		description: "El club alcanzó 50 sesiones realizadas",
		kind: "collective",
		earned: false,
	},
	{
		key: "hundred_questions",
		emoji: "🏆",
		name: "100 preguntas",
		description: "El club debatió 100 preguntas",
		kind: "collective",
		earned: false,
	},
];

export const EARNED = BADGES.filter((b) => b.earned);
export const UNEARNED = BADGES.filter((b) => !b.earned);
