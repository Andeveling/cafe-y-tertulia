import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { decodeRoomSnapshot } from "./room.schema";
import { snapshotAsOf } from "./room-sync";
import type { RoomSnapshot } from "./room-types";

export type RoomClient = Pick<SupabaseClient<Database>, "rpc">;

/**
 * Snapshot completo de la Sala: una sola llamada al RPC `room_snapshot` que
 * devuelve etapa, participantes, preguntas (visibilidad-aware), readiness,
 * sorteo y asignaciones. La decodificación vive en el seam `room.schema`;
 * aquí solo el fetch y el reloj `asOf`.
 */
export async function getRoomSnapshot(
	supabase: RoomClient,
	sessionId: string,
): Promise<RoomSnapshot | null> {
	const asOf = snapshotAsOf();
	const { data, error } = await supabase.rpc("room_snapshot", {
		target_session_id: sessionId,
	});
	if (error) throw error;

	const decoded = decodeRoomSnapshot(data);
	if (!decoded) return null;
	return { ...decoded, asOf };
}
