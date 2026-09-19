import { QuestionPool } from "@/app/materials/_components/question-pool";
import type { QuestionWithAuthor } from "../_lib/questions";

type MaterialQuestionsSectionProps = {
	materialId: string;
	sessionId: string;
	sessionRange: string;
	questions: QuestionWithAuthor[];
	currentUserId: string;
	isModerator: boolean;
};

/**
 * Sección "Preguntas del pool" de la página de material (SPEC §4.1): muestra
 * el pool de la Sesión y permite a los Miembros aportar. El moderador puede
 * marcar "Fuera de sorteo". Los datos los carga la página (una query por vista).
 */
export function MaterialQuestionsSection({
	materialId,
	sessionId,
	sessionRange,
	questions,
	currentUserId,
	isModerator,
}: MaterialQuestionsSectionProps) {
	return (
		<QuestionPool
			questions={questions}
			sessionId={sessionId}
			sessionRange={sessionRange}
			materialId={materialId}
			currentUserId={currentUserId}
			isModerator={isModerator}
		/>
	);
}
