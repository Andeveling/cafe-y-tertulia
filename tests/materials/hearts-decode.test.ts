import { describe, expect, it } from "vitest";
import { decodeRoomSnapshot } from "@/app/materials/_lib/room.schema";

/**
 * Hearts progress se decodifica dentro del bloque debate.active del
 * room_snapshot. Verificamos que el seam de decodificación nunca lanza
 * y produce los fallbacks correctos ante Json roto o parcial.
 */
describe("hearts decode in room_snapshot", () => {
	const baseSnapshot = {
		session_id: "sess-1",
		material_id: "mat-1",
		range: "Cap 1-3",
		status: "in_progress",
		moderator_id: "mod-1",
		room_stage: "debate",
		participants: [],
		questions: [],
		readiness: { total: 0, ready: 0, all_ready: false },
		draw: { done: true, status: "revealed", created_at: "2026-01-01" },
		assignments: [],
		debate: {
			mode: "active",
			assignmentId: "a1",
			state: "exposition",
			questionText: "¿Qué opinas?",
			assigneeName: "Ana",
			assigneeId: "u1",
			authorName: "Luis",
			revealOrder: 1,
			myNotes: null,
			phaseStartedAt: "2026-01-01T00:00:00Z",
			hearts: {
				my_heart: 4,
				voted: 2,
				eligible: 5,
			},
			remainingHidden: 0,
		},
		cierre: null,
	};

	it("decodifica hearts con campos válidos", () => {
		const snap = decodeRoomSnapshot(baseSnapshot);
		expect(snap).not.toBeNull();
		expect(snap!.debate).not.toBeNull();
		expect(snap!.debate!.mode).toBe("active");
		if (snap!.debate!.mode === "active") {
			expect(snap!.debate!.hearts).toEqual({
				myHeart: 4,
				voted: 2,
				eligible: 5,
			});
		}
	});

	it("hearts null decodifica a null", () => {
		const snap = decodeRoomSnapshot({
			...baseSnapshot,
			debate: { ...baseSnapshot.debate, hearts: null },
		});
		expect(snap).not.toBeNull();
		if (snap!.debate?.mode === "active") {
			expect(snap!.debate.hearts).toBeNull();
		}
	});

	it("hearts con tipos incorrectos produce fallbacks sin lanzar", () => {
		const snap = decodeRoomSnapshot({
			...baseSnapshot,
			debate: {
				...baseSnapshot.debate,
				hearts: {
					my_heart: "five",
					voted: "many",
					eligible: null,
				},
			},
		});
		expect(snap).not.toBeNull();
		if (snap!.debate?.mode === "active") {
			expect(snap!.debate.hearts).toEqual({
				myHeart: null,
				voted: 0,
				eligible: 0,
			});
		}
	});

	it("hearts ausente decodifica a null", () => {
		const { hearts: _, ...debateNoHearts } = baseSnapshot.debate;
		const snap = decodeRoomSnapshot({
			...baseSnapshot,
			debate: debateNoHearts,
		});
		expect(snap).not.toBeNull();
		if (snap!.debate?.mode === "active") {
			expect(snap!.debate.hearts).toBeNull();
		}
	});

	it("aprecio en assignments se decodifica", () => {
		const snap = decodeRoomSnapshot({
			...baseSnapshot,
			assignments: [
				{
					assignment_id: "a1",
					question_id: "q1",
					author_id: "u2",
					assignee_id: "u1",
					author_name: "Luis",
					assignee_name: "Ana",
					state: "complete",
					reveal_order: 1,
					question_text: "¿Qué opinas?",
					question_visible: true,
					aprecio_exposition_avg: 4.2,
					aprecio_exposition_count: 3,
					aprecio_complement_avg: 3.8,
					aprecio_complement_count: 2,
				},
			],
		});
		expect(snap).not.toBeNull();
		expect(snap!.assignments).toHaveLength(1);
		expect(snap!.assignments[0].aprecioExpositionAvg).toBe(4.2);
		expect(snap!.assignments[0].aprecioExpositionCount).toBe(3);
		expect(snap!.assignments[0].aprecioComplementAvg).toBe(3.8);
		expect(snap!.assignments[0].aprecioComplementCount).toBe(2);
	});

	it("aprecio ausente produce defaults sin lanzar", () => {
		const snap = decodeRoomSnapshot({
			...baseSnapshot,
			assignments: [
				{
					assignment_id: "a1",
					question_id: "q1",
					author_id: "u2",
					assignee_id: "u1",
					author_name: "Luis",
					assignee_name: "Ana",
					state: "complete",
					reveal_order: 1,
					question_text: null,
					question_visible: false,
				},
			],
		});
		expect(snap).not.toBeNull();
		expect(snap!.assignments[0].aprecioExpositionAvg).toBeNull();
		expect(snap!.assignments[0].aprecioExpositionCount).toBe(0);
		expect(snap!.assignments[0].aprecioComplementAvg).toBeNull();
		expect(snap!.assignments[0].aprecioComplementCount).toBe(0);
	});
});
