import "server-only";

import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";
import {
	decodeSnapshot,
	jArray,
	jBool,
	jNullNumber,
	jNullString,
	jNumber,
	jString,
} from "./snapshot-codec";

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

const TriviaBankItemSchema = z.object({
	id: jString,
	title: jString,
	itemCount: jNumber,
}) as unknown as z.ZodType<TriviaBankItem>;

const TakeCountsSchema = z
	.object({
		agree: jNumber,
		disagree: jNumber,
		neutral: jNumber,
	})
	.catch({ agree: 0, disagree: 0, neutral: 0 });

const TakeRowSchema = z.object({
	id: jString,
	prompt: jString,
	status: jString as unknown as z.ZodType<TakeRow["status"]>,
	counts: TakeCountsSchema,
}) as unknown as z.ZodType<TakeRow>;

export const MinigameStateSchema = z.object({
	liveRoundId: jNullString,
	lastBoardRoundId: jNullString,
	openTakeId: jNullString,
	bank: jArray(TriviaBankItemSchema),
	takes: jArray(TakeRowSchema),
	triviaRoundCount: jNumber,
	takeCount: jNumber,
}) as unknown as z.ZodType<MinigameState>;

/**
 * Seam de decodificación de Trivia/Take: Json del RPC `session_minigame_state`
 * → dominio, o null si no es un objeto. Nunca lanza.
 */
export function decodeMinigameState(raw: unknown): MinigameState | null {
	return decodeSnapshot(raw as Json | null | undefined, MinigameStateSchema);
}

const ScoreboardItemSchema = z.object({
	memberId: jString,
	displayName: jString,
	hits: jNumber,
});

const NullStringArray = z
	.array(jString)
	.nullable()
	.catch(null) as unknown as z.ZodType<string[] | null>;

const NullNumberArray = z
	.array(jNumber)
	.nullable()
	.catch(null) as unknown as z.ZodType<number[] | null>;

export const TriviaRoundSnapshotSchema = z.object({
	roundId: jString,
	sessionId: jString,
	triviaId: jString,
	status: jString as unknown as z.ZodType<TriviaRoundSnapshot["status"]>,
	questionIndex: jNumber,
	questionCount: jNumber,
	locked: jBool,
	prompt: jNullString,
	options: NullStringArray,
	answeredCount: jNumber,
	myOption: jNullNumber,
	optionCounts: NullNumberArray,
	scoreboard: jArray(ScoreboardItemSchema),
	winnerId: jNullString,
	winnerName: jNullString,
}) as unknown as z.ZodType<TriviaRoundSnapshot>;

/**
 * Seam de decodificación de una Ronda de trivia: Json del RPC
 * `trivia_round_snapshot` → dominio, o null si no es un objeto. Nunca lanza.
 */
export function decodeTriviaRoundSnapshot(
	raw: unknown,
): TriviaRoundSnapshot | null {
	return decodeSnapshot(
		raw as Json | null | undefined,
		TriviaRoundSnapshotSchema,
	);
}
