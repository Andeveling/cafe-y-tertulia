import { describe, expect, it } from "vitest";
import {
	scoreboard,
	scoreHits,
	takeCounts,
	triviaWinner,
} from "@/app/materials/_lib/trivia-score";

describe("scoreHits", () => {
	it("+1 por acierto, sin penalización", () => {
		const hits = scoreHits(
			[
				{ memberId: "a", optionIndex: 1 },
				{ memberId: "b", optionIndex: 0 },
				{ memberId: "c", optionIndex: 1 },
			],
			1,
		);
		expect(hits.get("a")).toBe(1);
		expect(hits.get("b")).toBeUndefined();
		expect(hits.get("c")).toBe(1);
	});

	it("acumula sobre hits previos", () => {
		const prev = new Map([["a", 2]]);
		const hits = scoreHits([{ memberId: "a", optionIndex: 0 }], 0, prev);
		expect(hits.get("a")).toBe(3);
	});
});

describe("scoreboard + winner", () => {
	const names = new Map([
		["a", "Ana"],
		["b", "Bruno"],
		["c", "Carla"],
	]);

	it("ordena por aciertos y nombra ganador único", () => {
		const board = scoreboard(
			new Map([
				["a", 2],
				["b", 3],
				["c", 1],
			]),
			names,
		);
		expect(board.map((r) => r.memberId)).toEqual(["b", "a", "c"]);
		expect(triviaWinner(board)).toBe("b");
	});

	it("empate o cero → sin ganador (insignia no se dispara)", () => {
		expect(
			triviaWinner(
				scoreboard(
					new Map([
						["a", 2],
						["b", 2],
					]),
					names,
				),
			),
		).toBeNull();
		expect(
			triviaWinner(
				scoreboard(
					new Map([
						["a", 0],
						["b", 0],
					]),
					names,
				),
			),
		).toBeNull();
	});
});

describe("takeCounts", () => {
	it("agrega posiciones anónimas", () => {
		expect(takeCounts(["agree", "agree", "neutral", "disagree"])).toEqual({
			agree: 2,
			disagree: 1,
			neutral: 1,
		});
	});
});
