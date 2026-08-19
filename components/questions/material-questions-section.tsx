import "server-only";
import { QuestionPool } from "@/components/questions/question-pool";
import { isActiveMember } from "@/lib/members";
import { getSessionPool } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

type MaterialQuestionsSectionProps = {
	materialId: string;
	sessionId: string;
	sessionRange: string;
};

/**
 * Sección "Preguntas del pool" de la página de material (SPEC §4.1): muestra
 * el pool de la Sesión y permite a los Miembros aportar. El moderador puede
 * marcar "Fuera de sorteo".
 */
export async function MaterialQuestionsSection({
	materialId,
	sessionId,
	sessionRange,
}: MaterialQuestionsSectionProps) {
	const supabase = await createClient();
	const { data: authData } = await supabase.auth.getUser();
	const user = authData.user;

	if (!user) {
		return null;
	}

	if (!(await isActiveMember(supabase, user.id))) {
		return null;
	}

	const [questions, session] = await Promise.all([
		getSessionPool(supabase, sessionId),
		supabase
			.from("sessions")
			.select("moderator_id")
			.eq("id", sessionId)
			.maybeSingle(),
	]);

	if (session.error || !session.data) {
		return null;
	}

	return (
		<QuestionPool
			questions={questions}
			sessionId={sessionId}
			sessionRange={sessionRange}
			materialId={materialId}
			currentUserId={user.id}
			isModerator={session.data.moderator_id === user.id}
		/>
	);
}
