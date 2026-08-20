import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

export type RatingClient = Pick<SupabaseClient<Database>, "rpc">;

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

function asString(v: Json | undefined, fallback = ""): string {
	return typeof v === "string" ? v : fallback;
}
function asNumber(v: Json | undefined, fallback = 0): number {
	return typeof v === "number" ? v : fallback;
}

export async function getRatingProgress(
	supabase: RatingClient,
	sessionId: string,
): Promise<RatingProgress | null> {
	const { data, error } = await supabase.rpc("rating_progress", {
		target_session_id: sessionId,
	});
	if (error) throw error;
	if (!data || typeof data !== "object" || Array.isArray(data)) return null;
	const row = data as Record<string, Json | undefined>;
	return {
		sessionId: asString(row.sessionId),
		materialId: asString(row.materialId),
		ratingOpen: row.ratingOpen === true,
		ratingAvg: typeof row.ratingAvg === "number" ? row.ratingAvg : null,
		ratingCount: asNumber(row.ratingCount),
		voted: asNumber(row.voted),
		total: asNumber(row.total),
		myStars: typeof row.myStars === "number" ? row.myStars : null,
		isModerator: row.isModerator === true,
		isParticipant: row.isParticipant === true,
		sessionStatus: asString(row.sessionStatus),
	};
}
