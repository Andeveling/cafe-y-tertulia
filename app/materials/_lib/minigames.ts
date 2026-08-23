import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { asNullString, asNumber, asString } from "./json-helpers";

export type MinigamesClient = Pick<SupabaseClient<Database>, "rpc" | "from">;

export type TriviaBankItem = {
	id: string;
	title: string;
	itemCount: number;
};

export type TakeRow = {
	id: string;
	prompt: string;
	status: "open" | "closed";
	counts: { agree: number; disagree: number; neutral: number };
};

export type MinigameState = {
	liveRoundId: string | null;
	lastBoardRoundId: string | null;
	openTakeId: string | null;
	bank: TriviaBankItem[];
	takes: TakeRow[];
	triviaRoundCount: number;
	takeCount: number;
};

export type TriviaRoundSnapshot = {
	roundId: string;
	sessionId: string;
	triviaId: string;
	status: "live" | "board";
	questionIndex: number;
	questionCount: number;
	locked: boolean;
	prompt: string | null;
	options: string[] | null;
	answeredCount: number;
	myOption: number | null;
	optionCounts: number[] | null;
	scoreboard: Array<{ memberId: string; displayName: string; hits: number }>;
	winnerId: string | null;
	winnerName: string | null;
};

export async function getMinigameState(
	supabase: MinigamesClient,
	sessionId: string,
): Promise<MinigameState | null> {
	const { data, error } = await supabase.rpc("session_minigame_state", {
		target_session_id: sessionId,
	});
	if (error) throw error;
	if (!data || typeof data !== "object" || Array.isArray(data)) return null;
	const row = data as Record<string, Json | undefined>;
	const bankRaw = Array.isArray(row.bank) ? row.bank : [];
	const takesRaw = Array.isArray(row.takes) ? row.takes : [];
	return {
		liveRoundId: asNullString(row.liveRoundId),
		lastBoardRoundId: asNullString(row.lastBoardRoundId),
		openTakeId: asNullString(row.openTakeId),
		bank: bankRaw.map((b) => {
			const o = b as Record<string, Json | undefined>;
			return {
				id: asString(o.id),
				title: asString(o.title),
				itemCount: asNumber(o.itemCount),
			};
		}),
		takes: takesRaw.map((t) => {
			const o = t as Record<string, Json | undefined>;
			const c = (o.counts ?? {}) as Record<string, Json | undefined>;
			return {
				id: asString(o.id),
				prompt: asString(o.prompt),
				status: asString(o.status) as "open" | "closed",
				counts: {
					agree: asNumber(c.agree),
					disagree: asNumber(c.disagree),
					neutral: asNumber(c.neutral),
				},
			};
		}),
		triviaRoundCount: asNumber(row.triviaRoundCount),
		takeCount: asNumber(row.takeCount),
	};
}

export async function getTriviaRoundSnapshot(
	supabase: MinigamesClient,
	roundId: string,
): Promise<TriviaRoundSnapshot | null> {
	const { data, error } = await supabase.rpc("trivia_round_snapshot", {
		target_round_id: roundId,
	});
	if (error) throw error;
	if (!data || typeof data !== "object" || Array.isArray(data)) return null;
	const row = data as Record<string, Json | undefined>;
	const opts = row.options;
	const counts = row.optionCounts;
	const board = Array.isArray(row.scoreboard) ? row.scoreboard : [];
	return {
		roundId: asString(row.roundId),
		sessionId: asString(row.sessionId),
		triviaId: asString(row.triviaId),
		status: asString(row.status) as "live" | "board",
		questionIndex: asNumber(row.questionIndex),
		questionCount: asNumber(row.questionCount),
		locked: row.locked === true,
		prompt: asNullString(row.prompt),
		options: Array.isArray(opts) ? opts.map((x) => String(x)) : null,
		answeredCount: asNumber(row.answeredCount),
		myOption: typeof row.myOption === "number" ? row.myOption : null,
		optionCounts: Array.isArray(counts)
			? counts.map((x) => (typeof x === "number" ? x : 0))
			: null,
		scoreboard: board.map((b) => {
			const o = b as Record<string, Json | undefined>;
			return {
				memberId: asString(o.memberId),
				displayName: asString(o.displayName),
				hits: asNumber(o.hits),
			};
		}),
		winnerId: asNullString(row.winnerId),
		winnerName: asNullString(row.winnerName),
	};
}

export async function listMaterialTrivias(
	supabase: MinigamesClient,
	materialId: string,
): Promise<TriviaBankItem[]> {
	const { data, error } = await supabase
		.from("trivias")
		.select("id, title")
		.eq("material_id", materialId)
		.order("created_at", { ascending: true });
	if (error) throw error;
	return (data ?? []).map((r) => ({
		id: r.id,
		title: r.title,
		itemCount: 0,
	}));
}
