"use client";

import { CierreStage } from "@/app/materials/_components/cierre-stage";
import { DrawCeremony } from "@/app/materials/_components/draw-ceremony";
import { StagePanel } from "@/app/materials/_components/stage-panel";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import type { RatingProgress } from "@/app/materials/_lib/rating";
import { advanceToDraw } from "@/app/materials/_lib/room-actions";

import { PresenceStage } from "./presence-stage";
import { QuestionsStage } from "./questions-stage";
import type { EtapaProps } from "./stage-props";

export function StageContent({
	snapshot,
	view,
	userId,
	isModerator,
	rating,
	rosterMembers = [],
	pendingIds = [],
	questionsAdvanceFor,
	onQuestionsAdvanceForChange,
}: EtapaProps & {
	questionsAdvanceFor?: Record<string, "wait" | "spectator">;
	onQuestionsAdvanceForChange?: (
		next: Record<string, "wait" | "spectator">,
	) => void;
	isModerator: boolean;
	rating: RatingProgress | null;
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
					advanceFor={questionsAdvanceFor}
					onAdvanceForChange={onQuestionsAdvanceForChange}
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
					onExecute={() => run(() => advanceToDraw(snapshot.sessionId))}
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
				</div>
			);
		}
		case "cierre":
			return (
				<CierreStage
					sessionId={snapshot.sessionId}
					rating={rating}
					isModerator={isModerator}
					hasMaterial={snapshot.materialId !== null}
				/>
			);
	}
}
