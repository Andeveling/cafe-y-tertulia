import "server-only";

import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";
import type { MaterialKind, MaterialStatus, SessionStatus } from "./constants";
import {
	decodeSnapshot,
	jArray,
	jBool,
	jNullNumber,
	jNullString,
	jNumber,
	jString,
} from "./snapshot-codec";

export type SessionHistory = {
	id: string;
	range: string | null;
	status: SessionStatus;
	scheduled_at: string | null;
	created_at: string;
	rating_avg: number | null;
	rating_count: number;
	material: {
		id: string;
		title: string;
		kind: MaterialKind;
		author: string;
		status: MaterialStatus;
		rating_avg: number | null;
		rating_count: number;
	};
	participants: {
		member_id: string;
		display_name: string;
		opt_out: boolean;
	}[];
	questions: {
		id: string;
		text: string;
		author: string;
		created_at: string;
		assignment?: {
			id: string;
			assignee: string;
			state: string;
			notes: string;
			aprecio_exposition_avg: number | null;
			aprecio_exposition_count: number;
			aprecio_complement_avg: number | null;
			aprecio_complement_count: number;
		};
	}[];
	trivia_rounds: {
		id: string;
		title: string;
		status: string;
		items: {
			member_id: string;
			display_name: string;
			hits: number;
		}[];
	}[];
	takes: {
		id: string;
		prompt: string;
		status: string;
		counts: { agree: number; disagree: number; neutral: number };
	}[];
	awards: {
		id: string;
		trigger: string;
		member_id: string | null;
		display_name: string | null;
		emoji: string;
		name: string;
		badge_key: string;
	}[];
};

const MaterialSchema = z
	.object({
		id: jString,
		title: jString,
		kind: jString as unknown as z.ZodType<MaterialKind>,
		author: jString,
		status: jString as unknown as z.ZodType<MaterialStatus>,
		rating_avg: jNullNumber,
		rating_count: jNumber,
	})
	.catch({
		id: "",
		title: "",
		kind: "" as MaterialKind,
		author: "",
		status: "" as MaterialStatus,
		rating_avg: null,
		rating_count: 0,
	});

const ParticipantSchema = z.object({
	member_id: jString,
	display_name: jString,
	opt_out: jBool,
});

const AssignmentSchema = z.object({
	id: jString,
	assignee: jString,
	state: jString,
	notes: jString,
	aprecio_exposition_avg: jNullNumber,
	aprecio_exposition_count: jNumber,
	aprecio_complement_avg: jNullNumber,
	aprecio_complement_count: jNumber,
});

const QuestionSchema = z
	.object({
		id: jString,
		text: jString,
		author: jString,
		created_at: jString,
		assignment: AssignmentSchema.nullable().catch(null),
	})
	.transform((q) => ({
		id: q.id,
		text: q.text,
		author: q.author,
		created_at: q.created_at,
		...(q.assignment ? { assignment: q.assignment } : {}),
	}));

const TriviaHitSchema = z.object({
	member_id: jString,
	display_name: jString,
	hits: jNumber,
});

const TriviaRoundSchema = z.object({
	id: jString,
	title: jString,
	status: jString,
	items: jArray(TriviaHitSchema),
});

const TakeCountsSchema = z
	.object({
		agree: jNumber,
		disagree: jNumber,
		neutral: jNumber,
	})
	.catch({ agree: 0, disagree: 0, neutral: 0 });

const TakeSchema = z.object({
	id: jString,
	prompt: jString,
	status: jString,
	counts: TakeCountsSchema,
});

const AwardSchema = z.object({
	id: jString,
	trigger: jString,
	member_id: jNullString,
	display_name: jNullString,
	emoji: z.string().catch("🏆"),
	name: jString,
	badge_key: jString,
});

export const SessionHistorySchema = z.object({
	id: jString,
	range: jString,
	status: jString as unknown as z.ZodType<SessionStatus>,
	scheduled_at: jNullString,
	created_at: jString,
	rating_avg: jNullNumber,
	rating_count: jNumber,
	material: MaterialSchema,
	participants: jArray(ParticipantSchema),
	questions: jArray(QuestionSchema),
	trivia_rounds: jArray(TriviaRoundSchema),
	takes: jArray(TakeSchema),
	awards: jArray(AwardSchema),
}) as unknown as z.ZodType<SessionHistory>;

/**
 * Seam de decodificación del Histórico: Json del RPC `get_session_history`
 * → dominio, o null si no es un objeto. Nunca lanza.
 */
export function decodeSessionHistory(raw: unknown): SessionHistory | null {
	return decodeSnapshot(raw as Json | null | undefined, SessionHistorySchema);
}
