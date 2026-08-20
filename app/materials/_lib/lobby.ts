import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type LobbyClient = Pick<SupabaseClient<Database>, "from" | "rpc">;

export type LobbyParticipant = {
	memberId: string;
	displayName: string;
	optOut: boolean;
};

export type LobbySnapshot = {
	sessionId: string;
	materialId: string;
	range: string;
	status: Database["public"]["Enums"]["session_status"];
	moderatorId: string | null;
	participants: LobbyParticipant[];
	/** true si ya hay fila de Sorteo (contenido sigue oculto). */
	drawDone: boolean;
	drawStatus: Database["public"]["Enums"]["draw_status"] | null;
	eligibleCount: number;
	optOutCount: number;
	unassignedNames: string[];
};

type ParticipantRow = {
	member_id: string;
	opt_out: boolean;
	members: { display_name: string } | null;
};

export async function getLobbySnapshot(
	supabase: LobbyClient,
	sessionId: string,
): Promise<LobbySnapshot | null> {
	const { data: session, error: sessionError } = await supabase
		.from("sessions")
		.select("id, material_id, range, status, moderator_id")
		.eq("id", sessionId)
		.maybeSingle();

	if (sessionError) throw sessionError;
	if (!session) return null;

	const { data: rows, error: partError } = await supabase
		.from("session_participants")
		.select("member_id, opt_out, members(display_name)")
		.eq("session_id", sessionId);

	if (partError) throw partError;

	const participants = ((rows ?? []) as unknown as ParticipantRow[]).map(
		(row) => ({
			memberId: row.member_id,
			displayName: row.members?.display_name ?? "Miembro",
			optOut: row.opt_out,
		}),
	);

	const { data: draw, error: drawError } = await supabase
		.from("draws")
		.select("status")
		.eq("session_id", sessionId)
		.maybeSingle();

	if (drawError) throw drawError;

	let unassignedNames: string[] = [];
	if (draw) {
		const { data: summary } = await supabase.rpc("draw_lobby_summary", {
			target_session_id: sessionId,
		});
		const names = (summary as { unassignedNames?: string[] } | null)
			?.unassignedNames;
		if (Array.isArray(names)) unassignedNames = names;
	}

	return {
		sessionId: session.id,
		materialId: session.material_id,
		range: session.range,
		status: session.status,
		moderatorId: session.moderator_id,
		participants,
		drawDone: Boolean(draw),
		drawStatus: draw?.status ?? null,
		eligibleCount: participants.filter((p) => !p.optOut).length,
		optOutCount: participants.filter((p) => p.optOut).length,
		unassignedNames,
	};
}
