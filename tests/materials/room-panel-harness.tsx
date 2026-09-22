/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { RoomPanel } from "@/app/materials/_components/room-panel";
import type { MinigameState } from "@/app/materials/_lib/minigames";
import type {
	RoomParticipant,
	RoomQuestion,
	RoomSnapshot,
} from "@/app/materials/_lib/room-types";

export { RoomPanel };

export function member(
	memberId: string,
	displayName: string,
	role: RoomParticipant["role"] = "member",
	optOut = false,
): RoomParticipant {
	return { memberId, displayName, avatar: null, role, optOut };
}

export function question(
	id: string,
	authorId: string,
	text: string | null,
	isMine: boolean,
): RoomQuestion {
	return {
		id,
		authorId,
		authorName: authorId,
		authorAvatar: null,
		text,
		isMine,
		outsideDraw: false,
		createdAt: "2026-01-01",
	};
}

export function snapshot(over: Partial<RoomSnapshot> = {}): RoomSnapshot {
	return {
		sessionId: "sess-1",
		materialId: "mat-1",
		range: "Cap. 1",
		status: "in_progress",
		moderatorId: "m-1",
		asOf: 1,
		roomStage: "questions",
		participants: [member("m-1", "Ana"), member("m-2", "Luis")],
		questions: [],
		readiness: { total: 2, ready: 0, allReady: false },
		draw: { done: false, status: null, createdAt: null },
		assignments: [],
		debate: null,
		cierre: null,
		...over,
	};
}

export function renderPanel(
	over: Partial<RoomSnapshot> = {},
	props: Partial<{
		userId: string;
		isModerator: boolean;
		minigameState: MinigameState | null;
	}> = {},
) {
	const snap = snapshot(over);
	return render(
		<RoomPanel
			snapshot={snap}
			userId={props.userId ?? "m-1"}
			isModerator={
				props.isModerator ?? snap.moderatorId === (props.userId ?? "m-1")
			}
			rating={null}
			minigameState={props.minigameState ?? null}
		/>,
	);
}
