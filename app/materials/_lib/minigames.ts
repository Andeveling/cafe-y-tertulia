import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type {
	MinigameState,
	TriviaBankItem,
	TriviaRoundSnapshot,
} from "./minigames.schema";
import {
	decodeMinigameState,
	decodeTriviaRoundSnapshot,
} from "./minigames.schema";

export type MinigamesClient = Pick<SupabaseClient<Database>, "rpc" | "from">;
export type {
	MinigameState,
	TakeRow,
	TriviaBankItem,
	TriviaRoundSnapshot,
} from "./minigames.schema";

export async function getMinigameState(
	supabase: MinigamesClient,
	sessionId: string,
): Promise<MinigameState | null> {
	const { data, error } = await supabase.rpc("session_minigame_state", {
		target_session_id: sessionId,
	});
	if (error) throw error;
	return decodeMinigameState(data);
}

export async function getTriviaRoundSnapshot(
	supabase: MinigamesClient,
	roundId: string,
): Promise<TriviaRoundSnapshot | null> {
	const { data, error } = await supabase.rpc("trivia_round_snapshot", {
		target_round_id: roundId,
	});
	if (error) throw error;
	return decodeTriviaRoundSnapshot(data);
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
