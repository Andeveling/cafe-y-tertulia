"use client";

import { useState } from "react";
import { RoomConnectionStatus } from "@/app/materials/_components/room/connection-status";
import { ModeratorNav } from "@/app/materials/_components/room/moderator-nav";
import { StageContent } from "@/app/materials/_components/room/stage-content";
import { StageBar } from "@/app/materials/_components/stage-bar";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import { useRoomRealtime } from "@/app/materials/_hooks/use-room-realtime";
import type {
	MinigameState,
	TriviaRoundSnapshot,
} from "@/app/materials/_lib/minigames";
import type { InviteRosterMember } from "@/app/materials/_lib/presence-invite";
import { questionsAdvance } from "@/app/materials/_lib/questions-advance";
import type { RatingProgress } from "@/app/materials/_lib/rating";
import {
	advanceRoomStage,
	setSpectator,
} from "@/app/materials/_lib/room-actions";
import type { RoomSnapshot } from "@/app/materials/_lib/room-types";
import { deriveSalaView } from "@/app/materials/_lib/room-view";
import { useClubPresence } from "@/hooks/use-club-presence";

type Props = {
	snapshot: RoomSnapshot;
	userId: string;
	isModerator: boolean;
	/** Progreso del rating — presente cuando la Sala está en Cierre. */
	rating: RatingProgress | null;
	minigameState?: MinigameState | null;
	round?: TriviaRoundSnapshot | null;
	rosterMembers?: InviteRosterMember[];
	pendingIds?: string[];
};

export function RoomPanel({
	snapshot,
	userId,
	isModerator,
	rating,
	minigameState = null,
	round = null,
	rosterMembers = [],
	pendingIds = [],
}: Props) {
	const { live } = useRoomRealtime(snapshot.sessionId);
	// Anuncia presencia en el club mientras la Sala está abierta. Sin esto
	// Inicio solo cuenta a quien tiene esa pantalla — miente "1 en línea".
	useClubPresence(userId, [], { salaId: snapshot.sessionId });
	// Una sola derivación: mesa, Listo, debate y avance (next/prev,
	// backBlocked, empty, warnings). Nav y Debate → Cierre la consumen.
	const view = deriveSalaView(snapshot);
	const { pending, run } = useRoomMutation();
	/** Pase de lista de Preguntas: por faltante, esperar o entra mirando. */
	const [advanceFor, setAdvanceFor] = useState<
		Record<string, "wait" | "spectator">
	>({});
	const questionsGate =
		snapshot.roomStage === "questions"
			? questionsAdvance({
					participants: snapshot.participants,
					questionAuthorIds: view.questionAuthorIds,
				})
			: null;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<StageBar current={snapshot.roomStage} />
				<RoomConnectionStatus live={live} />
			</div>

			<StageContent
				snapshot={snapshot}
				view={view}
				userId={userId}
				isModerator={isModerator}
				rating={rating}
				minigameState={minigameState}
				round={round}
				rosterMembers={rosterMembers}
				pendingIds={pendingIds}
				questionsAdvanceFor={advanceFor}
				onQuestionsAdvanceForChange={setAdvanceFor}
			/>

			{isModerator && (
				<ModeratorNav
					snapshot={snapshot}
					view={view}
					pending={snapshot.roomStage === "questions" ? pending : undefined}
					onAdvance={
						snapshot.roomStage === "questions"
							? () => {
									if (!questionsGate?.canAdvance) return;
									const toSpectators = snapshot.participants.filter(
										(p) =>
											questionsGate.missingIds.includes(p.memberId) &&
											advanceFor[p.memberId] === "spectator",
									);
									run(async () => {
										for (const m of toSpectators) {
											const r = await setSpectator(
												snapshot.sessionId,
												m.memberId,
												true,
											);
											if (!r.ok) return r;
										}
										return advanceRoomStage(snapshot.sessionId, "presence");
									});
								}
							: undefined
					}
					advanceDisabled={
						snapshot.roomStage === "questions" && !questionsGate?.canAdvance
					}
					advanceLabel={
						snapshot.roomStage === "questions"
							? "Avisar y avanzar a Presentes"
							: undefined
					}
				/>
			)}
		</div>
	);
}
