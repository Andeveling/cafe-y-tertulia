"use client";

import { CierreStage } from "@/app/materials/_components/cierre-stage";
import { DebateToolsTray } from "@/app/materials/_components/debate-tools-tray";
import { DrawCeremony } from "@/app/materials/_components/draw-ceremony";
import { StagePanel } from "@/app/materials/_components/stage-panel";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import type {
	MinigameState,
	TriviaRoundSnapshot,
} from "@/app/materials/_lib/minigames";
import type { RatingProgress } from "@/app/materials/_lib/rating";
import { executeDraw } from "@/app/materials/_lib/room-actions";

import { PresenceStage } from "./presence-stage";
import { QuestionsStage } from "./questions-stage";
import type { EtapaProps } from "./stage-props";

export function StageContent({
	snapshot,
	view,
	userId,
	isModerator,
	rating,
	minigameState,
	round,
	rosterMembers = [],
	pendingIds = [],
}: EtapaProps & {
	isModerator: boolean;
	rating: RatingProgress | null;
	minigameState?: MinigameState | null;
	round?: TriviaRoundSnapshot | null;
}) {
	const { pending, run } = useRoomMutation();

	switch (snapshot.roomStage) {
		case "questions":
			return (
				<QuestionsStage
					snapshot={snapshot}
					view={view}
					userId={userId}
					isModerator={isModerator}
					rosterMembers={rosterMembers}
					pendingIds={pendingIds}
				/>
			);
		case "presence":
			return (
				<PresenceStage
					snapshot={snapshot}
					view={view}
					userId={userId}
					isModerator={isModerator}
					rosterMembers={rosterMembers}
					pendingIds={pendingIds}
				/>
			);
		case "draw":
			return (
				<DrawCeremony
					snapshot={snapshot}
					userId={userId}
					isModerator={isModerator}
					pending={pending}
					onExecute={() => run(() => executeDraw(snapshot.sessionId))}
				/>
			);
		case "debate": {
			if (!snapshot.debate) return null;
			return (
				<div className="flex flex-col gap-8">
					<StagePanel
						debate={snapshot.debate}
						sessionId={snapshot.sessionId}
						userId={userId}
						isModerator={isModerator}
						asOf={snapshot.asOf}
						authorId={view.debateAuthorId}
						progress={view.debateProgress}
						lastAprecio={view.debateLastAprecio}
						members={view.members}
						nextAssigneeName={view.debateNextAssigneeName}
						next={view.next}
						empty={view.empty}
						warnings={view.warnings}
					/>
					{minigameState && (
						<DebateToolsTray
							sessionId={snapshot.sessionId}
							state={minigameState}
							round={round ?? null}
							isModerator={isModerator}
						/>
					)}
				</div>
			);
		}
		case "cierre":
			if (!snapshot.cierre) return null;
			return (
				<CierreStage
					sessionId={snapshot.sessionId}
					rating={rating}
					cierre={snapshot.cierre}
					isModerator={isModerator}
					hasMaterial={snapshot.materialId !== null}
				/>
			);
	}
}
