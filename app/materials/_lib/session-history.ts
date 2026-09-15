import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { SessionHistory } from "./session-history.schema";
import { decodeSessionHistory } from "./session-history.schema";

export type SessionHistoryClient = Pick<
	SupabaseClient<Database>,
	"from" | "rpc"
>;
export type { SessionHistory };

/** Lectura de una Sesión para el Histórico: una sola llamada al RPC `get_session_history`. */
export async function getSessionHistory(
	supabase: SessionHistoryClient,
	id: string,
): Promise<SessionHistory | null> {
	const { data, error } = await supabase.rpc(
		"get_session_history" as never,
		{
			target_session_id: id,
		} as never,
	);
	if (error) throw error;
	return decodeSessionHistory(data);
}
