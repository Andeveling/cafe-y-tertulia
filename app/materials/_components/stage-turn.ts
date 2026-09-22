import type {
	RoomDebateSnapshot,
	RoomParticipant,
} from "@/app/materials/_lib/room-types";

export type ActiveDebate = Extract<RoomDebateSnapshot, { mode: "active" }>;

export function turnCopy(
	debate: ActiveDebate,
	userId: string,
	authorId: string | null,
) {
	const youAssignee = debate.assigneeId === userId;
	const youAuthor = authorId === userId;
	if (debate.state === "exposition") {
		return youAssignee
			? { you: true, line: "Te toca hablar." }
			: { you: false, line: `Escuchas a ${debate.assigneeName}.` };
	}
	if (debate.state === "complement") {
		return youAuthor
			? { you: true, line: "Te toca complementar." }
			: {
					you: false,
					line: `${debate.authorName} complementa. Tú escuchas.`,
				};
	}
	return { you: false, line: "" };
}

export type SeatRole = "speaker" | "author" | "listener" | "past";

type Seat = {
	key: string;
	name: string;
	avatar: string | null;
	isYou: boolean;
	role: SeatRole;
};

export const SEAT_ROLE_LABEL: Record<SeatRole, string> = {
	speaker: "En la palabra",
	author: "Complementa",
	listener: "Escucha",
	past: "Expuso",
};

/**
 * Mesa del turno: expositor + autor siempre presentes aunque no estén en
 * `members`, resto escucha. Orden estable (el de la mesa, no el del turno)
 * para no marear en la pantalla compartida.
 */
export function buildSeats(
	debate: ActiveDebate,
	members: RoomParticipant[],
	authorId: string | null,
	userId: string,
): Seat[] {
	const list: RoomParticipant[] = [...members];
	const has = (id: string | null, name: string) =>
		list.some(
			(p) => (id != null && p.memberId === id) || p.displayName === name,
		);
	if (!has(debate.assigneeId, debate.assigneeName)) {
		list.push({
			memberId: debate.assigneeId,
			displayName: debate.assigneeName,
			avatar: debate.assigneeAvatar,
			role: "member",
			optOut: false,
		});
	}
	if (!has(authorId, debate.authorName)) {
		list.push({
			memberId: authorId ?? `name:${debate.authorName}`,
			displayName: debate.authorName,
			avatar: debate.authorAvatar,
			role: "member",
			optOut: false,
		});
	}
	const isComplement = debate.state === "complement";
	return list.map((p) => {
		const isAssignee =
			p.memberId === debate.assigneeId || p.displayName === debate.assigneeName;
		const isAuthor =
			(authorId != null && p.memberId === authorId) ||
			p.displayName === debate.authorName;
		const role: SeatRole = isComplement
			? isAuthor
				? "speaker"
				: isAssignee
					? "past"
					: "listener"
			: isAssignee
				? "speaker"
				: isAuthor
					? "author"
					: "listener";
		return {
			key: p.memberId,
			name: p.displayName,
			avatar: p.avatar,
			isYou: p.memberId === userId,
			role,
		};
	});
}
