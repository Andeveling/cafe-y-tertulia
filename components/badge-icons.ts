import {
	Award01Icon,
	Book02Icon,
	BookOpen01Icon,
	Brain01Icon,
	Calendar01Icon,
	ChampionIcon,
	Chat01Icon,
	Coffee02Icon,
	Compass01Icon,
	Idea01Icon,
	Medal01Icon,
	Mic01Icon,
	PuzzleIcon,
	QuillWrite01Icon,
	StarIcon,
	Target01Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";

/**
 * Iconografía estándar de insignias e hitos (Hugeicons, sin emoji).
 * La clave es `badges.key` en la DB; el `emoji` de la DB se ignora en UI.
 */
export const BADGE_ICONS: Record<string, typeof Coffee02Icon> = {
	first_question: Coffee02Icon,
	elephant_memory: Brain01Icon,
	perspective_shift: Idea01Icon,
	thought_provoking_question: Target01Icon,
	perfect_participation: StarIcon,
	consistent_reader: BookOpen01Icon,
	first_book_finished: Book02Icon,
	fifty_sessions: Award01Icon,
	hundred_questions: ChampionIcon,
	mesa_llena: UserGroupIcon,
	triviantes: PuzzleIcon,
	debate_intenso: Chat01Icon,
	exploradores: Compass01Icon,
	club_de_plata: Medal01Icon,
};

export const RECOGNITION_ICONS: Record<string, typeof Coffee02Icon> = {
	trivia_master: Brain01Icon,
	great_debater: Mic01Icon,
	question_creator: QuillWrite01Icon,
	perfect_attendance: Calendar01Icon,
};

export function getBadgeIcon(key: string): typeof Coffee02Icon {
	return BADGE_ICONS[key] ?? Award01Icon;
}
