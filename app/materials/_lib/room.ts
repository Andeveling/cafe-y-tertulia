import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { asArray, asBool, asNumber, asString } from "./json-helpers";
import type {
	AssignmentState,
	DrawStatus,
	ParticipantRole,
	RoomAssignment,
	RoomDraw,
	RoomParticipant,
	RoomQuestion,
	RoomReadiness,
	RoomSnapshot,
} from "./room-types";

export type RoomClient = Pick<SupabaseClient<Database>, "rpc">;

/**
 * Snapshot completo de la Sala: una sola llamada al RPC `room_snapshot` que
 * devuelve etapa, participantes, preguntas (visibilidad-aware), readiness,
 * sorteo y asignaciones. El módulo más profundo del feature Sala.
 */
export async function getRoomSnapshot(
	supabase: RoomClient,
	sessionId: string,
): Promise<RoomSnapshot | null> {
	const { data, error } = await supabase.rpc("room_snapshot", {
		target_session_id: sessionId,
	});
	if (error) throw error;
	if (!data || typeof data !== "object" || Array.isArray(data)) return null;

	const row = data as Record<string, Json | undefined>;

	const participants = asArray<Record<string, Json | undefined>>(
		row.participants,
	).map((p) => ({
		memberId: asString(p.member_id),
		displayName: asString(p.display_name),
		role: (p.role as ParticipantRole) ?? "member",
		optOut: asBool(p.opt_out),
	}));

	const questions = asArray<Record<string, Json | undefined>>(
		row.questions,
	).map((q) => ({
		id: asString(q.id),
		authorId: asString(q.author_id),
		authorName: asString(q.author_name),
		text: typeof q.text === "string" ? q.text : null,
		isMine: asBool(q.is_mine),
		outsideDraw: asBool(q.outside_draw),
		createdAt: asString(q.created_at),
	}));

	const readinessRow = row.readiness as
		| Record<string, Json | undefined>
		| undefined;
	const readiness: RoomReadiness = {
		total: asNumber(readinessRow?.total),
		ready: asNumber(readinessRow?.ready),
		allReady: asBool(readinessRow?.all_ready),
	};

	const drawRow = row.draw as Record<string, Json | undefined> | undefined;
	const draw: RoomDraw = {
		done: asBool(drawRow?.done),
		status: (drawRow?.status as DrawStatus) ?? null,
	};

	const assignments = asArray<Record<string, Json | undefined>>(
		row.assignments,
	).map((a) => ({
		assignmentId: asString(a.assignment_id),
		questionId: asString(a.question_id),
		authorName: asString(a.author_name),
		assigneeName: asString(a.assignee_name),
		state: (a.state as AssignmentState) ?? "hidden",
		revealOrder: asNumber(a.reveal_order),
		questionText: typeof a.question_text === "string" ? a.question_text : null,
		questionVisible: asBool(a.question_visible),
	}));

	return {
		sessionId: asString(row.session_id),
		materialId: asString(row.material_id),
		range: asString(row.range),
		status: row.status as Database["public"]["Enums"]["session_status"],
		moderatorId: typeof row.moderator_id === "string" ? row.moderator_id : null,
		roomStage:
			(row.room_stage as Database["public"]["Enums"]["room_stage"]) ??
			"questions",
		participants,
		questions,
		readiness,
		draw,
		assignments,
	};
}
