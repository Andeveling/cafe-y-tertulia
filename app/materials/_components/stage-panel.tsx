"use client";

import { ActiveTurn } from "@/app/materials/_components/active-turn";
import { DebateDone } from "@/app/materials/_components/debate-done";
import { Enter } from "@/app/materials/_components/stage-enter";
import { WaitingRevealView } from "@/app/materials/_components/waiting-reveal-view";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import { interventionProgressLine } from "@/app/materials/_lib/intervention";
import { revealNext } from "@/app/materials/_lib/room-actions";
import type {
	RoomDebateSnapshot,
	RoomParticipant,
	RoomStage,
} from "@/app/materials/_lib/room-types";
import type { TurnoAprecio } from "@/app/materials/_lib/room-view";

type Props = {
	debate: RoomDebateSnapshot;
	sessionId: string;
	userId: string;
	isModerator: boolean;
	/** Autor de la pregunta activa — para “te toca complementar”. */
	authorId?: string | null;
	/** Progreso de intervenciones para “X de Y”. */
	progress?: { current: number; total: number } | null;
	/** Aprecio del último turno completado — se revela entre turnos. */
	lastAprecio?: TurnoAprecio | null;
	/** Mesa completa — para mostrar quién expone, complementa y escucha. */
	members?: RoomParticipant[];
	/** Siguiente en exponer — primera oculta por revealOrder. */
	nextAssigneeName?: string | null;
	/** Reloj del snapshot: primer paint idéntico en SSR e hidratación. */
	asOf?: number;
	/** Congela el reloj — stories / tests. */
	nowMs?: number;
	/** Avance derivado — Nav y Debate → Cierre consumen lo mismo. */
	next?: RoomStage | null;
	empty?: boolean;
	warnings?: string[];
};

export function StagePanel({
	debate,
	sessionId,
	userId,
	isModerator,
	authorId = null,
	progress = null,
	lastAprecio = null,
	members = [],
	nextAssigneeName = null,
	asOf,
	nowMs,
	next = null,
	empty = false,
	warnings = [],
}: Props) {
	if (debate.mode === "done") {
		return (
			<DebateDone
				sessionId={sessionId}
				isModerator={isModerator}
				next={next}
				empty={empty}
				warnings={warnings}
			/>
		);
	}

	if (debate.mode === "waiting_reveal") {
		return (
			<WaitingReveal
				debate={debate}
				sessionId={sessionId}
				userId={userId}
				isModerator={isModerator}
				progress={progress}
				lastAprecio={lastAprecio}
			/>
		);
	}

	return (
		<ActiveTurn
			debate={debate}
			sessionId={sessionId}
			userId={userId}
			isModerator={isModerator}
			authorId={authorId}
			progress={progress}
			members={members}
			nextAssigneeName={nextAssigneeName}
			asOf={asOf}
			nowMs={nowMs}
		/>
	);
}

function WaitingReveal({
	debate,
	sessionId,
	userId,
	isModerator,
	progress,
	lastAprecio,
}: {
	debate: Extract<RoomDebateSnapshot, { mode: "waiting_reveal" }>;
	sessionId: string;
	userId: string;
	isModerator: boolean;
	progress?: { current: number; total: number } | null;
	lastAprecio?: TurnoAprecio | null;
}) {
	const { pending, run } = useRoomMutation();
	const youNext = debate.nextAssigneeId === userId;
	const progressText =
		progress && progress.total > 0
			? interventionProgressLine(progress.current, progress.total)
			: null;
	const revealLabel =
		progress && progress.total > 0
			? `Revelar pregunta ${progress.current} para ${debate.nextAssigneeName}`
			: `Revelar pregunta para ${debate.nextAssigneeName}`;

	return (
		<Enter>
			<WaitingRevealView
				nextAssigneeName={debate.nextAssigneeName}
				nextAssigneeAvatar={debate.nextAssigneeAvatar}
				youNext={youNext}
				isModerator={isModerator}
				progressText={progressText}
				revealLabel={revealLabel}
				pending={pending}
				lastAprecio={lastAprecio ?? null}
				onReveal={
					isModerator ? () => run(() => revealNext(sessionId)) : undefined
				}
			/>
		</Enter>
	);
}
