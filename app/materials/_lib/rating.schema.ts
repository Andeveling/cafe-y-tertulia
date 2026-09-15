import "server-only";

import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";
import {
	decodeSnapshot,
	jBool,
	jNullNumber,
	jNumber,
	jString,
} from "./snapshot-codec";

export type RatingProgress = {
	sessionId: string;
	materialId: string;
	ratingOpen: boolean;
	ratingAvg: number | null;
	ratingCount: number;
	voted: number;
	total: number;
	myStars: number | null;
	isModerator: boolean;
	isParticipant: boolean;
	sessionStatus: string;
};

export const RatingProgressSchema = z.object({
	sessionId: jString,
	materialId: jString,
	ratingOpen: jBool,
	ratingAvg: jNullNumber,
	ratingCount: jNumber,
	voted: jNumber,
	total: jNumber,
	myStars: jNullNumber,
	isModerator: jBool,
	isParticipant: jBool,
	sessionStatus: jString,
}) as unknown as z.ZodType<RatingProgress>;

/**
 * Seam de decodificación del Rating: Json del RPC `rating_progress` →
 * dominio, o null si no es un objeto. Nunca lanza.
 */
export function decodeRatingProgress(raw: unknown): RatingProgress | null {
	return decodeSnapshot(raw as Json | null | undefined, RatingProgressSchema);
}
