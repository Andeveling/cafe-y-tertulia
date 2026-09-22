import {
	ROOM_STAGE_ORDER,
	type RoomParticipant,
	type RoomSnapshot,
	type RoomStage,
} from "./room-types";

export type DebateProgress = { current: number; total: number };

/** Aprecio del último turno completado — null si aún no hay ninguno. */
export type TurnoAprecio = {
	assigneeName: string;
	respuestaAvg: number | null;
	respuestaCount: number;
	preguntaAvg: number | null;
	preguntaCount: number;
};

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
	/** Aprecio del último turno completado — para revelar entre turnos. */
	debateLastAprecio: TurnoAprecio | null;
	/** Siguiente en exponer — primera oculta por revealOrder en `active`. */
	debateNextAssigneeName: string | null;
	/** Siguiente Etapa — null en Cierre. */
	next: RoomStage | null;
	/** Etapa anterior — null en Preguntas. */
	prev: RoomStage | null;
	/** Volver a Preguntas/Presentes queda bloqueado tras el Sorteo. */
	backBlocked: boolean;
	/** Mesa sin members — bloquea avanzar a Sorteo o Debate. */
	empty: boolean;
	/** Avisos de avance (Intervenciones pendientes al ir a Cierre). */
	warnings: string[];
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
		.filter((p) => !p.optOut && !questionAuthorIds.has(p.memberId))
		.map((p) => p.displayName);

	const remainingInterventions = snapshot.assignments.filter(
		(a) => a.state !== "complete",
	).length;

	let debateAuthorId: string | null = null;
	let debateProgress: DebateProgress | null = null;
	let debateNextAssigneeName: string | null = null;
	let debateLastAprecio: TurnoAprecio | null = null;
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
		const lastComplete = [...snapshot.assignments]
			.filter((a) => a.state === "complete")
			.sort((a, b) => b.revealOrder - a.revealOrder)[0];
		if (lastComplete) {
			debateLastAprecio = {
				assigneeName: lastComplete.assigneeName,
				respuestaAvg: lastComplete.aprecioExpositionAvg,
				respuestaCount: lastComplete.aprecioExpositionCount,
				preguntaAvg: lastComplete.aprecioComplementAvg,
				preguntaCount: lastComplete.aprecioComplementCount,
			};
		}
	}

	const currentIdx = ROOM_STAGE_ORDER.indexOf(snapshot.roomStage);
	const next = ROOM_STAGE_ORDER[currentIdx + 1] ?? null;
	const prev =
		currentIdx > 0 ? (ROOM_STAGE_ORDER[currentIdx - 1] ?? null) : null;
	const backBlocked =
		!!prev &&
		snapshot.draw.done &&
		(prev === "questions" || prev === "presence");
	const empty = members.length === 0 && (next === "draw" || next === "debate");
	const warnings =
		next === "cierre" && remainingInterventions > 0
			? [`${remainingInterventions} turno(s) sin completar`]
			: [];

	return {
		members,
		spectators,
		moderatorName,
		questionAuthorIds,
		notReadyNames,
		remainingInterventions,
		debateAuthorId,
		debateProgress,
		debateLastAprecio,
		debateNextAssigneeName,
		next,
		prev,
		backBlocked,
		empty,
		warnings,
	};
}
