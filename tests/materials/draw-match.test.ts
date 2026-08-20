import { describe, expect, it } from "vitest";
import { matchDraw } from "@/app/materials/_lib/draw-match";

/** RNG determinista (LCG) para asserts estables. */
function lcg(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s = (Math.imul(1664525, s) + 1013904223) >>> 0;
		return s / 0x100000000;
	};
}

describe("matchDraw", () => {
	it("nadie recibe su propia Pregunta", () => {
		const out = matchDraw({
			participants: [
				{ memberId: "a", optOut: false },
				{ memberId: "b", optOut: false },
			],
			questions: [
				{ id: "qA", authorId: "a", outsideDraw: false },
				{ id: "qB", authorId: "b", outsideDraw: false },
			],
			random: lcg(1),
		});
		expect(out).toHaveLength(2);
		for (const row of out) {
			if (row.assigneeId === "a") expect(row.questionId).not.toBe("qA");
			if (row.assigneeId === "b") expect(row.questionId).not.toBe("qB");
		}
	});

	it("respeta Sin sorteo y Fuera de sorteo", () => {
		const out = matchDraw({
			participants: [
				{ memberId: "a", optOut: true },
				{ memberId: "b", optOut: false },
			],
			questions: [
				{ id: "q1", authorId: "x", outsideDraw: true },
				{ id: "q2", authorId: "x", outsideDraw: false },
			],
			random: lcg(2),
		});
		expect(out).toEqual([
			expect.objectContaining({
				assigneeId: "b",
				questionId: "q2",
				revealOrder: 1,
			}),
		]);
	});

	it("máximo 2 asignados por Pregunta; sobrantes sin asignación", () => {
		const out = matchDraw({
			participants: ["a", "b", "c", "d", "e"].map((memberId) => ({
				memberId,
				optOut: false,
			})),
			questions: [{ id: "only", authorId: "z", outsideDraw: false }],
			random: lcg(3),
		});
		expect(out).toHaveLength(2);
		expect(new Set(out.map((r) => r.assigneeId)).size).toBe(2);
		expect(out.every((r) => r.questionId === "only")).toBe(true);
	});

	it("reveal_order es 1..n sin huecos", () => {
		const out = matchDraw({
			participants: ["a", "b", "c"].map((memberId) => ({
				memberId,
				optOut: false,
			})),
			questions: [
				{ id: "q1", authorId: "x", outsideDraw: false },
				{ id: "q2", authorId: "y", outsideDraw: false },
			],
			random: lcg(9),
		});
		const orders = out.map((r) => r.revealOrder).sort((a, b) => a - b);
		expect(orders).toEqual(orders.map((_, i) => i + 1));
	});
});
