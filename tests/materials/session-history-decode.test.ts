import { describe, expect, it } from "vitest";
import {
	getSessionHistory,
	type SessionHistoryClient,
} from "@/app/materials/_lib/session-history";
import { decodeSessionHistory } from "@/app/materials/_lib/session-history.schema";

const row = {
	id: "sess-1",
	range: "Cap. 1-3",
	status: "archived",
	scheduled_at: "2026-01-01T10:00:00Z",
	created_at: "2026-01-01T09:00:00Z",
	rating_avg: 4.5,
	rating_count: 3,
	material: {
		id: "mat-1",
		title: "El Aleph",
		kind: "book",
		author: "Borges",
		status: "finished",
		rating_avg: 4.2,
		rating_count: 10,
	},
	participants: [{ member_id: "m-1", display_name: "Ana", opt_out: false }],
	questions: [
		{
			id: "q-1",
			text: "¿Qué te movió?",
			author: "Ana",
			created_at: "2026-01-01T09:30:00Z",
			assignment: {
				id: "a-1",
				assignee: "Luis",
				state: "complete",
				notes: "ideas",
				aprecio_exposition_avg: 4.3,
				aprecio_exposition_count: 5,
				aprecio_complement_avg: 4.7,
				aprecio_complement_count: 4,
			},
		},
	],
	trivia_rounds: [
		{
			id: "round-1",
			title: "Cap. 1",
			status: "board",
			items: [{ member_id: "m-1", display_name: "Ana", hits: 3 }],
		},
	],
	takes: [
		{
			id: "take-1",
			prompt: "El final justifica…",
			status: "closed",
			counts: { agree: 2, disagree: 1, neutral: 0 },
		},
	],
	awards: [
		{
			id: "aw-1",
			trigger: "moderator",
			member_id: "m-1",
			display_name: "Ana",
			emoji: "🐘",
			name: "Memoria de elefante",
			badge_key: "elephant",
		},
	],
};

function rpcClient(payload: unknown): SessionHistoryClient {
	return {
		rpc: async () => ({ data: payload, error: null }),
	} as unknown as SessionHistoryClient;
}

describe("decodeSessionHistory", () => {
	it("decodifica el JSON del RPC a dominio", () => {
		expect(decodeSessionHistory(row)).toEqual(row);
	});

	it("omite assignment nulo y cae a material vacío", () => {
		const decoded = decodeSessionHistory({
			...row,
			material: null,
			scheduled_at: null,
			rating_avg: null,
			questions: [
				{
					id: "q-2",
					text: "Sin asignar",
					author: "Luis",
					created_at: "2026-01-01T09:40:00Z",
					assignment: null,
				},
			],
			awards: [
				{
					id: "aw-2",
					trigger: "threshold",
					member_id: null,
					display_name: null,
				},
			],
		});
		expect(decoded).toMatchObject({
			scheduled_at: null,
			rating_avg: null,
			material: {
				id: "",
				title: "",
				kind: "",
				author: "",
				status: "",
				rating_avg: null,
				rating_count: 0,
			},
		});
		expect(decoded!.questions).toEqual([
			{
				id: "q-2",
				text: "Sin asignar",
				author: "Luis",
				created_at: "2026-01-01T09:40:00Z",
			},
		]);
		expect(decoded!.awards).toEqual([
			{
				id: "aw-2",
				trigger: "threshold",
				member_id: null,
				display_name: null,
				emoji: "🏆",
				name: "",
				badge_key: "",
			},
		]);
	});

	it("nunca lanza: fallbacks ante claves ausentes o tipos incorrectos", () => {
		const history = decodeSessionHistory({
			id: 1,
			participants: "no-array",
			questions: [{ id: "q-1" }],
			takes: [{ id: "t-1", counts: null }],
		});
		expect(history).toMatchObject({
			id: "",
			range: "",
			status: "",
			scheduled_at: null,
			created_at: "",
			rating_avg: null,
			rating_count: 0,
			participants: [],
			trivia_rounds: [],
			awards: [],
		});
		expect(history!.questions).toEqual([
			{
				id: "q-1",
				text: "",
				author: "",
				created_at: "",
			},
		]);
		expect(history!.takes).toEqual([
			{
				id: "t-1",
				prompt: "",
				status: "",
				counts: { agree: 0, disagree: 0, neutral: 0 },
			},
		]);
	});

	it("tolera assignment sin claves de aprecio (RPC anterior)", () => {
		const decoded = decodeSessionHistory({
			...row,
			questions: [
				{
					id: "q-9",
					text: "Legado",
					author: "Ana",
					created_at: "2026-01-01T09:30:00Z",
					assignment: {
						id: "a-9",
						assignee: "Luis",
						state: "complete",
						notes: "",
					},
				},
			],
		});
		expect(decoded!.questions).toEqual([
			{
				id: "q-9",
				text: "Legado",
				author: "Ana",
				created_at: "2026-01-01T09:30:00Z",
				assignment: {
					id: "a-9",
					assignee: "Luis",
					state: "complete",
					notes: "",
					aprecio_exposition_avg: null,
					aprecio_exposition_count: 0,
					aprecio_complement_avg: null,
					aprecio_complement_count: 0,
				},
			},
		]);
	});

	it("devuelve null ante Json no-objeto", () => {
		expect(decodeSessionHistory(null)).toBeNull();
		expect(decodeSessionHistory("str")).toBeNull();
		expect(decodeSessionHistory([])).toBeNull();
	});
});

describe("getSessionHistory", () => {
	it("pasa el JSON del RPC por el seam", async () => {
		expect(await getSessionHistory(rpcClient(row), "sess-1")).toEqual(row);
		expect(
			await getSessionHistory(rpcClient({ id: 1, material: null }), "sess-1"),
		).toMatchObject({
			id: "",
			rating_avg: null,
			material: { id: "", title: "" },
			participants: [],
		});
	});

	it("devuelve null si el RPC no trae objeto", async () => {
		expect(await getSessionHistory(rpcClient(null), "sess-1")).toBeNull();
	});
});
