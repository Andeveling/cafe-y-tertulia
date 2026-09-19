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
			aprecioExpositionAvg: null,
			aprecioExpositionCount: 0,
			aprecioComplementAvg: null,
			aprecioComplementCount: 0,
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
			aprecioExpositionAvg: null,
			aprecioExpositionCount: 0,
			aprecioComplementAvg: null,
			aprecioComplementCount: 0,
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
		hearts: null,
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
		// a-2 está activa y no hay ocultas: nadie sigue.
		expect(view.debateNextAssigneeName).toBeNull();
	});

	it("resuelve quién sigue en exponer", () => {
		const view = deriveSalaView({
			...base,
			assignments: [
				...base.assignments,
				{
					assignmentId: "a-3",
					questionId: "q-1",
					authorId: "m-2",
					assigneeId: "m-1",
					authorName: "Luis",
					assigneeName: "Ana",
					state: "hidden",
					revealOrder: 2,
					questionText: null,
					questionVisible: false,
					aprecioExpositionAvg: null,
					aprecioExpositionCount: 0,
					aprecioComplementAvg: null,
					aprecioComplementCount: 0,
				},
			],
		});
		expect(view.debateNextAssigneeName).toBe("Ana");
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

	it("deriva el Aprecio del último turno completado", () => {
		const view = deriveSalaView({
			...base,
			assignments: base.assignments.map((a) =>
				a.assignmentId === "a-1"
					? {
							...a,
							aprecioExpositionAvg: 4.3,
							aprecioExpositionCount: 5,
							aprecioComplementAvg: 4.7,
							aprecioComplementCount: 4,
						}
					: a,
			),
		});
		expect(view.debateLastAprecio).toEqual({
			assigneeName: "Luis",
			respuestaAvg: 4.3,
			respuestaCount: 5,
			preguntaAvg: 4.7,
			preguntaCount: 4,
		});
	});

	it("sin turnos completados no hay Aprecio previo", () => {
		const view = deriveSalaView({
			...base,
			assignments: base.assignments.map((a) => ({
				...a,
				state: "hidden" as const,
			})),
		});
		expect(view.debateLastAprecio).toBeNull();
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

	it("deriva siguiente y anterior Etapa", () => {
		const questions = deriveSalaView({
			...base,
			roomStage: "questions",
			debate: null,
		});
		expect(questions.next).toBe("presence");
		expect(questions.prev).toBeNull();

		const presence = deriveSalaView({
			...base,
			roomStage: "presence",
			debate: null,
		});
		expect(presence.next).toBe("draw");
		expect(presence.prev).toBe("questions");

		const draw = deriveSalaView({
			...base,
			roomStage: "draw",
			debate: null,
		});
		expect(draw.next).toBe("debate");
		expect(draw.prev).toBe("presence");

		const debate = deriveSalaView(base);
		expect(debate.next).toBe("cierre");
		expect(debate.prev).toBe("draw");

		const cierre = deriveSalaView({
			...base,
			roomStage: "cierre",
			debate: null,
			cierre: { openTrivia: 0, openTakes: 0 },
		});
		expect(cierre.next).toBeNull();
		expect(cierre.prev).toBe("debate");
	});

	it("bloquea volver a Preguntas/Presentes si el Sorteo ya se ejecutó", () => {
		const afterSorteo = deriveSalaView({
			...base,
			roomStage: "draw",
			debate: null,
		});
		expect(afterSorteo.backBlocked).toBe(true);
		expect(afterSorteo.prev).toBe("presence");

		const debate = deriveSalaView(base);
		expect(debate.backBlocked).toBe(false);
		expect(debate.prev).toBe("draw");

		const beforeSorteo = deriveSalaView({
			...base,
			roomStage: "draw",
			debate: null,
			draw: { done: false, status: null, createdAt: null },
		});
		expect(beforeSorteo.backBlocked).toBe(false);

		const presence = deriveSalaView({
			...base,
			roomStage: "presence",
			debate: null,
			draw: { done: false, status: null, createdAt: null },
		});
		expect(presence.backBlocked).toBe(false);
	});

	it("marca mesa vacía solo al avanzar a Sorteo o Debate", () => {
		const vacant = {
			...base,
			participants: [],
			questions: [],
			moderatorId: null,
			debate: null,
			assignments: [],
			draw: { done: false, status: null, createdAt: null },
		};

		expect(deriveSalaView({ ...vacant, roomStage: "questions" }).empty).toBe(
			false,
		);
		expect(deriveSalaView({ ...vacant, roomStage: "presence" }).empty).toBe(
			true,
		);
		expect(deriveSalaView({ ...vacant, roomStage: "draw" }).empty).toBe(true);
		expect(deriveSalaView({ ...vacant, roomStage: "debate" }).empty).toBe(
			false,
		);

		expect(deriveSalaView(base).empty).toBe(false);
	});

	it("avisa quién no está Listo al avanzar a Debate", () => {
		const draw = deriveSalaView({
			...base,
			roomStage: "draw",
			debate: null,
		});
		expect(draw.warnings).toEqual(["Luis"]);

		const presence = deriveSalaView({
			...base,
			roomStage: "presence",
			debate: null,
		});
		expect(presence.warnings).toEqual([]);
	});

	it("avisa Intervenciones pendientes al avanzar a Cierre; vacío si el Debate terminó", () => {
		const midDebate = deriveSalaView(base);
		expect(midDebate.next).toBe("cierre");
		expect(midDebate.warnings).toEqual(["1 turno(s) sin completar"]);

		const done = deriveSalaView({
			...base,
			assignments: base.assignments.map((a) => ({
				...a,
				state: "complete" as const,
			})),
			debate: { mode: "done", remainingHidden: 0 },
		});
		expect(done.next).toBe("cierre");
		expect(done.empty).toBe(false);
		expect(done.warnings).toEqual([]);
	});
});
