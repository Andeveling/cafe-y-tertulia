import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { RatingProgress } from "./rating.schema";
import { decodeRatingProgress } from "./rating.schema";

export type RatingClient = Pick<SupabaseClient<Database>, "rpc">;
export type { RatingProgress };

export async function getRatingProgress(
	supabase: RatingClient,
	sessionId: string,
): Promise<RatingProgress | null> {
	const { data, error } = await supabase.rpc("rating_progress", {
		target_session_id: sessionId,
	});
	if (error) throw error;
	return decodeRatingProgress(data);
}
