import type { RoomParticipant, RoomSnapshot } from "./room-types";

export type DebateProgress = { current: number; total: number };

/**
 * Vista derivada de la Sala: lo que cada Etapa necesita sin recalcular.
 * Se deriva una sola vez por render en `RoomPanel`; las Etapas la reciben
 * hecha. Puro y testeable sin React.
 */
export type SalaView = {
	members: RoomParticipant[];
	spectators: RoomParticipant[];
	moderatorName: string | null;
	/** Miembros con ≥1 pregunta (condición de Listo). */
	questionAuthorIds: Set<string>;
	/** Nombres de miembros sin pregunta — aviso de avance del Moderador. */
	notReadyNames: string[];
	/** Asignaciones sin completar — aviso de avance a Cierre. */
	remainingInterventions: number;
	/** Autor de la Intervención activa — null fuera de `active`. */
	debateAuthorId: string | null;
	debateProgress: DebateProgress | null;
	/** Siguiente en exponer — primera oculta por revealOrder en `active`. */
	debateNextAssigneeName: string | null;
};

export function deriveSalaView(snapshot: RoomSnapshot): SalaView {
	const members = snapshot.participants.filter((p) => p.role === "member");
	const spectators = snapshot.participants.filter(
		(p) => p.role === "spectator",
	);
	const moderatorName =
		snapshot.participants.find((p) => p.memberId === snapshot.moderatorId)
			?.displayName ?? null;

	const questionAuthorIds = new Set(snapshot.questions.map((q) => q.authorId));
	const notReadyNames = members
		.filter((p) => !questionAuthorIds.has(p.memberId))
		.map((p) => p.displayName);

	const remainingInterventions = snapshot.assignments.filter(
		(a) => a.state !== "complete",
	).length;

	let debateAuthorId: string | null = null;
	let debateProgress: DebateProgress | null = null;
	let debateNextAssigneeName: string | null = null;
	const debate = snapshot.debate;
	if (debate) {
		if (debate.mode === "active") {
			debateAuthorId =
				snapshot.assignments.find((a) => a.assignmentId === debate.assignmentId)
					?.authorId ?? null;
			debateNextAssigneeName =
				[...snapshot.assignments]
					.filter((a) => a.state === "hidden")
					.sort((a, b) => a.revealOrder - b.revealOrder)[0]?.assigneeName ??
				null;
		}
		const total = snapshot.assignments.length;
		if (total > 0) {
			debateProgress = {
				current: debate.mode === "done" ? total : debate.revealOrder,
				total,
			};
		}
	}

	return {
		members,
		spectators,
		moderatorName,
		questionAuthorIds,
		notReadyNames,
		remainingInterventions,
		debateAuthorId,
		debateProgress,
		debateNextAssigneeName,
	};
}
