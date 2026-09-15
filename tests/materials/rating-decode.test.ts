import { describe, expect, it } from "vitest";
import {
	getRatingProgress,
	type RatingClient,
} from "@/app/materials/_lib/rating";
import { decodeRatingProgress } from "@/app/materials/_lib/rating.schema";

const row = {
	sessionId: "sess-1",
	materialId: "mat-1",
	ratingOpen: true,
	ratingAvg: 4.5,
	ratingCount: 2,
	voted: 2,
	total: 3,
	myStars: 5,
	isModerator: false,
	isParticipant: true,
	sessionStatus: "in_progress",
};

function rpcClient(payload: unknown): RatingClient {
	return {
		rpc: async () => ({ data: payload, error: null }),
	} as unknown as RatingClient;
}

describe("decodeRatingProgress", () => {
	it("decodifica el JSON del RPC a dominio", () => {
		expect(decodeRatingProgress(row)).toEqual(row);
	});

	it("conserva nulos del RPC en promedio y voto propio", () => {
		expect(
			decodeRatingProgress({
				...row,
				ratingAvg: null,
				myStars: null,
				ratingOpen: false,
			}),
		).toMatchObject({
			ratingAvg: null,
			myStars: null,
			ratingOpen: false,
		});
	});

	it("nunca lanza: fallbacks ante claves ausentes o tipos incorrectos", () => {
		const progress = decodeRatingProgress({
			sessionId: 42,
			ratingAvg: "n/a",
			ratingOpen: "yes",
			myStars: "5",
		});
		expect(progress).toEqual({
			sessionId: "",
			materialId: "",
			ratingOpen: false,
			ratingAvg: null,
			ratingCount: 0,
			voted: 0,
			total: 0,
			myStars: null,
			isModerator: false,
			isParticipant: false,
			sessionStatus: "",
		});
	});

	it("devuelve null ante Json no-objeto", () => {
		expect(decodeRatingProgress(null)).toBeNull();
		expect(decodeRatingProgress("str")).toBeNull();
		expect(decodeRatingProgress([])).toBeNull();
	});
});

describe("getRatingProgress", () => {
	it("pasa el JSON del RPC por el seam", async () => {
		expect(await getRatingProgress(rpcClient(row), "sess-1")).toEqual(row);
		expect(
			await getRatingProgress(
				rpcClient({ sessionId: 42, ratingAvg: "n/a" }),
				"sess-1",
			),
		).toMatchObject({
			sessionId: "",
			ratingAvg: null,
			ratingOpen: false,
		});
	});

	it("devuelve null si el RPC no trae objeto", async () => {
		expect(await getRatingProgress(rpcClient(null), "sess-1")).toBeNull();
	});
});
