import { describe, expect, it } from "vitest";
import {
	getMinigameState,
	getTriviaRoundSnapshot,
	type MinigamesClient,
} from "@/app/materials/_lib/minigames";
import {
	decodeMinigameState,
	decodeTriviaRoundSnapshot,
} from "@/app/materials/_lib/minigames.schema";

const minigameRow = {
	liveRoundId: "round-live",
	lastBoardRoundId: "round-board",
	openTakeId: "take-1",
	bank: [{ id: "tr-1", title: "Cap. 1", itemCount: 4 }],
	takes: [
		{
			id: "take-1",
			prompt: "El final justifica…",
			status: "open" as const,
			counts: { agree: 2, disagree: 1, neutral: 0 },
		},
	],
	triviaRoundCount: 1,
	takeCount: 1,
};

const triviaRow = {
	roundId: "round-1",
	sessionId: "sess-1",
	triviaId: "tr-1",
	status: "live" as const,
	questionIndex: 0,
	questionCount: 4,
	locked: false,
	prompt: "¿Quién narra?",
	options: ["A", "B", "C", "D"],
	answeredCount: 2,
	myOption: 1,
	optionCounts: null,
	scoreboard: [],
	winnerId: null,
	winnerName: null,
};

function rpcClient(payload: unknown): MinigamesClient {
	return {
		rpc: async () => ({ data: payload, error: null }),
	} as unknown as MinigamesClient;
}

describe("decodeMinigameState", () => {
	it("decodifica el JSON del RPC a dominio", () => {
		expect(decodeMinigameState(minigameRow)).toEqual(minigameRow);
	});

	it("conserva nulos del RPC cuando no hay ronda ni take abiertos", () => {
		expect(
			decodeMinigameState({
				...minigameRow,
				liveRoundId: null,
				lastBoardRoundId: null,
				openTakeId: null,
				bank: [],
				takes: [],
			}),
		).toMatchObject({
			liveRoundId: null,
			lastBoardRoundId: null,
			openTakeId: null,
			bank: [],
			takes: [],
		});
	});

	it("nunca lanza: fallbacks ante claves ausentes o tipos incorrectos", () => {
		const state = decodeMinigameState({
			liveRoundId: 42,
			bank: "no-array",
			takes: [{ id: "t-1", counts: null }],
		});
		expect(state).toEqual({
			liveRoundId: null,
			lastBoardRoundId: null,
			openTakeId: null,
			bank: [],
			takes: [
				{
					id: "t-1",
					prompt: "",
					status: "",
					counts: { agree: 0, disagree: 0, neutral: 0 },
				},
			],
			triviaRoundCount: 0,
			takeCount: 0,
		});
	});

	it("devuelve null ante Json no-objeto", () => {
		expect(decodeMinigameState(null)).toBeNull();
		expect(decodeMinigameState("str")).toBeNull();
		expect(decodeMinigameState([])).toBeNull();
	});
});

describe("decodeTriviaRoundSnapshot", () => {
	it("decodifica el JSON del RPC a dominio", () => {
		expect(decodeTriviaRoundSnapshot(triviaRow)).toEqual(triviaRow);
	});

	it("decodifica el tablero con conteos y ganador", () => {
		const board = decodeTriviaRoundSnapshot({
			...triviaRow,
			status: "board",
			locked: true,
			prompt: null,
			options: null,
			optionCounts: [2, 1, 0, 0],
			scoreboard: [
				{ memberId: "m-1", displayName: "Ana", hits: 3 },
				{ memberId: "m-2", displayName: "Luis", hits: 1 },
			],
			winnerId: "m-1",
			winnerName: "Ana",
			myOption: null,
		});
		expect(board).toMatchObject({
			status: "board",
			locked: true,
			prompt: null,
			options: null,
			optionCounts: [2, 1, 0, 0],
			winnerId: "m-1",
			winnerName: "Ana",
			myOption: null,
		});
		expect(board!.scoreboard).toEqual([
			{ memberId: "m-1", displayName: "Ana", hits: 3 },
			{ memberId: "m-2", displayName: "Luis", hits: 1 },
		]);
	});

	it("nunca lanza: fallbacks ante claves ausentes o tipos incorrectos", () => {
		const snap = decodeTriviaRoundSnapshot({
			roundId: 1,
			locked: "yes",
			options: "no-array",
			optionCounts: "no-array",
			scoreboard: [{ memberId: "m-1" }],
		});
		expect(snap).toEqual({
			roundId: "",
			sessionId: "",
			triviaId: "",
			status: "",
			questionIndex: 0,
			questionCount: 0,
			locked: false,
			prompt: null,
			options: null,
			answeredCount: 0,
			myOption: null,
			optionCounts: null,
			scoreboard: [{ memberId: "m-1", displayName: "", hits: 0 }],
			winnerId: null,
			winnerName: null,
		});
	});

	it("devuelve null ante Json no-objeto", () => {
		expect(decodeTriviaRoundSnapshot(null)).toBeNull();
		expect(decodeTriviaRoundSnapshot([])).toBeNull();
	});
});

describe("getMinigameState / getTriviaRoundSnapshot", () => {
	it("pasan el JSON del RPC por el seam", async () => {
		expect(await getMinigameState(rpcClient(minigameRow), "sess-1")).toEqual(
			minigameRow,
		);
		expect(
			await getTriviaRoundSnapshot(rpcClient(triviaRow), "round-1"),
		).toEqual(triviaRow);
		expect(
			await getMinigameState(
				rpcClient({ liveRoundId: 42, bank: "no" }),
				"sess-1",
			),
		).toMatchObject({ liveRoundId: null, bank: [], triviaRoundCount: 0 });
		expect(
			await getTriviaRoundSnapshot(
				rpcClient({ roundId: 1, options: "no" }),
				"round-1",
			),
		).toMatchObject({ roundId: "", options: null, locked: false });
	});

	it("devuelven null si el RPC no trae objeto", async () => {
		expect(await getMinigameState(rpcClient(null), "sess-1")).toBeNull();
		expect(await getTriviaRoundSnapshot(rpcClient(null), "round-1")).toBeNull();
	});
});
