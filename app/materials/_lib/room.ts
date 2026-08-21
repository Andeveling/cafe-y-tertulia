import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
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

function asString(v: Json | undefined, fallback = ""): string {
	return typeof v === "string" ? v : fallback;
}

function asBool(v: Json | undefined, fallback = false): boolean {
	return typeof v === "boolean" ? v : fallback;
}

function asNumber(v: Json | undefined, fallback = 0): number {
	return typeof v === "number" ? v : fallback;
}

function asArray<T>(v: Json | undefined): T[] {
	return Array.isArray(v) ? (v as T[]) : [];
}

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
		memberId: asString(p.memberId),
		displayName: asString(p.displayName, "Miembro"),
		role: asString(p.role, "member") as ParticipantRole,
		optOut: asBool(p.optOut),
	}));

	const questions = asArray<Record<string, Json | undefined>>(
		row.questions,
	).map((q) => ({
		id: asString(q.id),
		authorId: asString(q.authorId),
		authorName: asString(q.authorName, "Miembro"),
		text: q.text == null ? null : asString(q.text),
		isMine: asBool(q.isMine),
		outsideDraw: asBool(q.outsideDraw),
		createdAt: asString(q.createdAt),
	}));

	const readinessRow = row.readiness as
		| Record<string, Json | undefined>
		| undefined;
	const readiness: RoomReadiness = {
		total: asNumber(readinessRow?.total),
		ready: asNumber(readinessRow?.ready),
		allReady: asBool(readinessRow?.allReady),
	};

	const drawRow = row.draw as Record<string, Json | undefined> | undefined;
	const draw: RoomDraw = {
		done: asBool(drawRow?.done),
		status:
			drawRow?.status == null ? null : (asString(drawRow.status) as DrawStatus),
	};

	const assignments = asArray<Record<string, Json | undefined>>(
		row.assignments,
	).map((a) => ({
		assignmentId: asString(a.assignmentId),
		questionId: asString(a.questionId),
		authorName: asString(a.authorName),
		assigneeName: asString(a.assigneeName),
		state: asString(a.state) as AssignmentState,
		revealOrder: asNumber(a.revealOrder),
		questionText: a.questionText == null ? null : asString(a.questionText),
		questionVisible: asBool(a.questionVisible),
	}));

	return {
		sessionId: asString(row.sessionId),
		materialId: asString(row.materialId),
		range: asString(row.range),
		status: asString(
			row.status,
		) as Database["public"]["Enums"]["session_status"],
		moderatorId: row.moderatorId == null ? null : asString(row.moderatorId),
		roomStage: asString(
			row.roomStage,
			"questions",
		) as Database["public"]["Enums"]["room_stage"],
		participants,
		questions,
		readiness,
		draw,
		assignments,
	};
}
