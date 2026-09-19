import { describe, expect, it } from "vitest";
import { decodeRoomSnapshot } from "@/app/materials/_lib/room.schema";

/**
 * Avatares en el room_snapshot: el seam decodifica `avatar` de
 * participantes, preguntas, asignaciones y debate, y cae a null cuando el
 * payload no los trae (snapshot anterior a la migración).
 */
describe("avatar decode in room_snapshot", () => {
	const base = {
		session_id: "sess-1",
		material_id: null,
		range: null,
		status: "lobby",
		moderator_id: null,
		room_stage: "debate",
		participants: [
			{
				member_id: "u-ana",
				display_name: "Ana",
				avatar: "/avatars/Avatar01.svg",
				role: "member",
				opt_out: false,
			},
			{
				member_id: "u-luis",
				display_name: "Luis",
				avatar: null,
				role: "member",
				opt_out: false,
			},
		],
		questions: [
			{
				id: "q-1",
				author_id: "u-ana",
				author_name: "Ana",
				author_avatar: "/avatars/Avatar01.svg",
				text: null,
				is_mine: false,
				outside_draw: false,
				created_at: "2026-01-01",
			},
		],
		readiness: { total: 2, ready: 0, all_ready: false },
		draw: { done: true, status: "revealed", created_at: "2026-01-01" },
		assignments: [
			{
				assignment_id: "a-1",
				question_id: "q-1",
				author_id: "u-ana",
				assignee_id: "u-luis",
				author_name: "Ana",
				assignee_name: "Luis",
				author_avatar: "/avatars/Avatar01.svg",
				assignee_avatar: null,
				state: "exposition",
				reveal_order: 0,
				question_text: "¿Qué te movió?",
				question_visible: true,
				aprecio_exposition_avg: null,
				aprecio_exposition_count: 0,
				aprecio_complement_avg: null,
				aprecio_complement_count: 0,
			},
		],
		debate: {
			mode: "active",
			assignmentId: "a-1",
			state: "exposition",
			questionText: "¿Qué te movió?",
			assigneeName: "Luis",
			assigneeId: "u-luis",
			assigneeAvatar: null,
			authorName: "Ana",
			authorAvatar: "/avatars/Avatar01.svg",
			revealOrder: 0,
			myNotes: null,
			phaseStartedAt: "2026-01-01T00:00:00Z",
			hearts: null,
			remainingHidden: 0,
		},
		cierre: null,
	};

	it("mapea avatar en participantes, preguntas, asignaciones y debate", () => {
		const snap = decodeRoomSnapshot(base);
		expect(snap).not.toBeNull();
		expect(snap!.participants).toEqual([
			expect.objectContaining({
				memberId: "u-ana",
				avatar: "/avatars/Avatar01.svg",
			}),
			expect.objectContaining({ memberId: "u-luis", avatar: null }),
		]);
		expect(snap!.questions[0]).toMatchObject({
			authorAvatar: "/avatars/Avatar01.svg",
		});
		expect(snap!.assignments[0]).toMatchObject({
			authorAvatar: "/avatars/Avatar01.svg",
			assigneeAvatar: null,
		});
		expect(snap!.debate).toMatchObject({
			mode: "active",
			assigneeAvatar: null,
			authorAvatar: "/avatars/Avatar01.svg",
		});
	});

	it("cae a null cuando el payload no trae avatar (snapshot viejo)", () => {
		const legacy = {
			...base,
			participants: base.participants.map(({ avatar: _dropped, ...p }) => p),
			questions: base.questions.map(({ author_avatar: _dropped, ...q }) => q),
			assignments: base.assignments.map(
				({ author_avatar: _a, assignee_avatar: _b, ...a }) => a,
			),
			debate: {
				mode: "waiting_reveal",
				nextAssigneeName: "Luis",
				nextAssigneeId: "u-luis",
				revealOrder: 0,
				remainingHidden: 1,
			},
		};
		const snap = decodeRoomSnapshot(legacy);
		expect(snap).not.toBeNull();
		expect(snap!.participants.every((p) => p.avatar === null)).toBe(true);
		expect(snap!.questions[0]!.authorAvatar).toBeNull();
		expect(snap!.assignments[0]).toMatchObject({
			authorAvatar: null,
			assigneeAvatar: null,
		});
		expect(snap!.debate).toMatchObject({
			mode: "waiting_reveal",
			nextAssigneeAvatar: null,
		});
	});
});
