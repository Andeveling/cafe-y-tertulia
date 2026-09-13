import { describe, expect, it } from "vitest";
import type { RoomSnapshot } from "@/app/materials/_lib/room-types";
import { deriveSalaView } from "@/app/materials/_lib/room-view";

const base: RoomSnapshot = {
	sessionId: "sess-1",
	materialId: "mat-1",
	range: "Cap. 1-3",
	status: "in_progress",
	moderatorId: "m-1",
	asOf: 1,
	roomStage: "debate",
	participants: [
		{ memberId: "m-1", displayName: "Ana", role: "member", optOut: false },
		{ memberId: "m-2", displayName: "Luis", role: "member", optOut: false },
		{ memberId: "m-3", displayName: "Mia", role: "spectator", optOut: false },
	],
	questions: [
		{
			id: "q-1",
			authorId: "m-1",
			authorName: "Ana",
			text: "¿Qué te movió?",
			isMine: false,
			outsideDraw: false,
			createdAt: "2026-01-01",
		},
	],
	readiness: { total: 2, ready: 1, allReady: false },
	draw: { done: true, status: "revealed", createdAt: "2026-01-02" },
	assignments: [
		{
			assignmentId: "a-1",
			questionId: "q-1",
			authorId: "m-1",
			assigneeId: "m-2",
			authorName: "Ana",
			assigneeName: "Luis",
			state: "complete",
			revealOrder: 0,
			questionText: "¿Qué te movió?",
			questionVisible: true,
		},
		{
			assignmentId: "a-2",
			questionId: "q-1",
			authorId: "m-1",
			assigneeId: "m-2",
			authorName: "Ana",
			assigneeName: "Luis",
			state: "exposition",
			revealOrder: 1,
			questionText: "¿Qué te movió?",
			questionVisible: true,
		},
	],
	debate: {
		mode: "active",
		assignmentId: "a-2",
		state: "exposition",
		questionText: "¿Qué te movió?",
		assigneeName: "Luis",
		assigneeId: "m-2",
		authorName: "Ana",
		revealOrder: 1,
		myNotes: null,
		phaseStartedAt: "2026-01-03",
		remainingHidden: 0,
	},
	cierre: null,
};

describe("deriveSalaView", () => {
	it("deriva mesa, Listo y debate una sola vez", () => {
		const view = deriveSalaView(base);

		expect(view.members.map((p) => p.memberId)).toEqual(["m-1", "m-2"]);
		expect(view.spectators.map((p) => p.memberId)).toEqual(["m-3"]);
		expect(view.moderatorName).toBe("Ana");
		expect(view.questionAuthorIds.has("m-1")).toBe(true);
		expect(view.questionAuthorIds.has("m-2")).toBe(false);
		expect(view.notReadyNames).toEqual(["Luis"]);
		expect(view.remainingInterventions).toBe(1);
		expect(view.debateAuthorId).toBe("m-1");
		expect(view.debateProgress).toEqual({ current: 1, total: 2 });
	});

	it("resuelve progreso en espera, fin y sin debate", () => {
		const waiting = deriveSalaView({
			...base,
			debate: {
				mode: "waiting_reveal",
				nextAssigneeName: "Luis",
				nextAssigneeId: "m-2",
				revealOrder: 1,
				remainingHidden: 1,
			},
		});
		expect(waiting.debateAuthorId).toBeNull();
		expect(waiting.debateProgress).toEqual({ current: 1, total: 2 });

		const done = deriveSalaView({
			...base,
			debate: { mode: "done", remainingHidden: 0 },
		});
		expect(done.debateProgress).toEqual({ current: 2, total: 2 });

		const plain = deriveSalaView({ ...base, debate: null, assignments: [] });
		expect(plain.debateAuthorId).toBeNull();
		expect(plain.debateProgress).toBeNull();
		expect(plain.remainingInterventions).toBe(0);
	});

	it("tolera Sala vacía", () => {
		const view = deriveSalaView({
			...base,
			participants: [],
			questions: [],
			moderatorId: null,
			debate: null,
			assignments: [],
		});
		expect(view.members).toEqual([]);
		expect(view.moderatorName).toBeNull();
		expect(view.notReadyNames).toEqual([]);
		expect(view.debateProgress).toBeNull();
	});
});
