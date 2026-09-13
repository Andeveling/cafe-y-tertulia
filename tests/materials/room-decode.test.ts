import { describe, expect, it } from "vitest";
import { decodeRoomSnapshot } from "@/app/materials/_lib/room.schema";

const fullRow = {
	session_id: "sess-1",
	material_id: "mat-1",
	range: "Cap. 1-3",
	status: "in_progress",
	moderator_id: "mod-1",
	room_stage: "debate",
	participants: [
		{
			member_id: "m-1",
			display_name: "Ana",
			role: "member",
			opt_out: false,
		},
	],
	questions: [
		{
			id: "q-1",
			author_id: "m-1",
			author_name: "Ana",
			text: "¿Qué te movió?",
			is_mine: true,
			outside_draw: false,
			created_at: "2026-01-01",
		},
	],
	readiness: { total: 2, ready: 1, all_ready: false },
	draw: { done: true, status: "revealed", created_at: "2026-01-02" },
	assignments: [
		{
			assignment_id: "a-1",
			question_id: "q-1",
			author_id: "m-1",
			assignee_id: "m-2",
			author_name: "Ana",
			assignee_name: "Luis",
			state: "exposition",
			reveal_order: 0,
			question_text: "¿Qué te movió?",
			question_visible: true,
		},
	],
	debate: {
		mode: "active",
		assignmentId: "a-1",
		state: "exposition",
		questionText: "¿Qué te movió?",
		assigneeName: "Luis",
		assigneeId: "m-2",
		authorName: "Ana",
		revealOrder: 0,
		myNotes: "ideas",
		phaseStartedAt: "2026-01-03",
		remainingHidden: 1,
	},
	cierre: { open_trivia: 0, open_takes: 1 },
};

describe("decodeRoomSnapshot", () => {
	it("decodifica snake_case del RPC a dominio camelCase", () => {
		const snap = decodeRoomSnapshot(fullRow);
		expect(snap).not.toBeNull();
		expect(snap).toMatchObject({
			sessionId: "sess-1",
			materialId: "mat-1",
			range: "Cap. 1-3",
			status: "in_progress",
			moderatorId: "mod-1",
			roomStage: "debate",
			readiness: { total: 2, ready: 1, allReady: false },
			draw: { done: true, status: "revealed", createdAt: "2026-01-02" },
			cierre: { openTrivia: 0, openTakes: 1 },
		});
		expect(snap!.participants).toEqual([
			{ memberId: "m-1", displayName: "Ana", role: "member", optOut: false },
		]);
		expect(snap!.questions).toEqual([
			{
				id: "q-1",
				authorId: "m-1",
				authorName: "Ana",
				text: "¿Qué te movió?",
				isMine: true,
				outsideDraw: false,
				createdAt: "2026-01-01",
			},
		]);
		expect(snap!.debate).toEqual({
			mode: "active",
			assignmentId: "a-1",
			state: "exposition",
			questionText: "¿Qué te movió?",
			assigneeName: "Luis",
			assigneeId: "m-2",
			authorName: "Ana",
			revealOrder: 0,
			myNotes: "ideas",
			phaseStartedAt: "2026-01-03",
			remainingHidden: 1,
		});
	});

	it("decodifica waiting_reveal, done y nulos", () => {
		const waiting = decodeRoomSnapshot({
			...fullRow,
			debate: {
				mode: "waiting_reveal",
				nextAssigneeName: "Luis",
				nextAssigneeId: "m-2",
				revealOrder: 1,
				remainingHidden: 2,
			},
		});
		expect(waiting!.debate).toEqual({
			mode: "waiting_reveal",
			nextAssigneeName: "Luis",
			nextAssigneeId: "m-2",
			revealOrder: 1,
			remainingHidden: 2,
		});

		const done = decodeRoomSnapshot({
			...fullRow,
			debate: { mode: "done", remainingHidden: 0 },
			cierre: null,
		});
		expect(done!.debate).toEqual({ mode: "done", remainingHidden: 0 });
		expect(done!.cierre).toBeNull();

		const plain = decodeRoomSnapshot({ ...fullRow, debate: null });
		expect(plain!.debate).toBeNull();
	});

	it("nunca lanza: fallbacks ante claves ausentes o tipos incorrectos", () => {
		const snap = decodeRoomSnapshot({
			session_id: 42,
			participants: "no-array",
			questions: [{ id: "q-1" }],
			readiness: null,
			assignments: [{ assignment_id: "a-1", state: 42 }],
		});
		expect(snap).not.toBeNull();
		expect(snap!.sessionId).toBe("");
		expect(snap!.roomStage).toBe("questions");
		expect(snap!.participants).toEqual([]);
		expect(snap!.questions[0]).toMatchObject({
			authorId: "",
			text: null,
			isMine: false,
		});
		expect(snap!.readiness).toEqual({ total: 0, ready: 0, allReady: false });
		expect(snap!.draw).toEqual({ done: false, status: null, createdAt: null });
		expect(snap!.assignments).toEqual([
			{
				assignmentId: "a-1",
				questionId: "",
				authorId: "",
				assigneeId: "",
				authorName: "",
				assigneeName: "",
				state: "hidden",
				revealOrder: 0,
				questionText: null,
				questionVisible: false,
			},
		]);
		expect(snap!.debate).toBeNull();
		expect(snap!.cierre).toBeNull();
	});

	it("devuelve null ante Json no-objeto", () => {
		expect(decodeRoomSnapshot(null)).toBeNull();
		expect(decodeRoomSnapshot("str")).toBeNull();
		expect(decodeRoomSnapshot([])).toBeNull();
	});
});
