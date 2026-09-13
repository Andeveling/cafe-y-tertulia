import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
	asArray,
	asBool,
	asNullString,
	asNumber,
	asString,
} from "./json-helpers";
import { snapshotAsOf } from "./room-sync";
import type {
	AssignmentState,
	DrawStatus,
	ParticipantRole,
	RoomAssignment,
	RoomCierreSnapshot,
	RoomDebateSnapshot,
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
	const asOf = snapshotAsOf();
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
		createdAt: asNullString(drawRow?.created_at),
	};

	const assignments = asArray<Record<string, Json | undefined>>(
		row.assignments,
	).map((a) => ({
		assignmentId: asString(a.assignment_id),
		questionId: asString(a.question_id),
		authorId: asString(a.author_id),
		assigneeId: asString(a.assignee_id),
		authorName: asString(a.author_name),
		assigneeName: asString(a.assignee_name),
		state: (a.state as AssignmentState) ?? "hidden",
		revealOrder: asNumber(a.reveal_order),
		questionText: typeof a.question_text === "string" ? a.question_text : null,
		questionVisible: asBool(a.question_visible),
	}));

	// Debate: null cuando roomStage !== 'debate'
	const debateRow = row.debate as
		| Record<string, Json | undefined>
		| undefined
		| null;
	let debate: RoomDebateSnapshot | null = null;

	if (debateRow) {
		const mode = asString(debateRow.mode);
		if (mode === "active") {
			debate = {
				mode: "active",
				assignmentId: asString(debateRow.assignmentId),
				state: asString(debateRow.state) as AssignmentState,
				questionText: asString(debateRow.questionText),
				assigneeName: asString(debateRow.assigneeName),
				assigneeId: asString(debateRow.assigneeId),
				authorName: asString(debateRow.authorName),
				revealOrder: asNumber(debateRow.revealOrder),
				myNotes:
					typeof debateRow.myNotes === "string" ? debateRow.myNotes : null,
				phaseStartedAt: asString(debateRow.phaseStartedAt),
				remainingHidden: asNumber(debateRow.remainingHidden),
			};
		} else if (mode === "waiting_reveal") {
			debate = {
				mode: "waiting_reveal",
				nextAssigneeName: asString(debateRow.nextAssigneeName),
				nextAssigneeId: asString(debateRow.nextAssigneeId),
				revealOrder: asNumber(debateRow.revealOrder),
				remainingHidden: asNumber(debateRow.remainingHidden),
			};
		} else if (mode === "done") {
			debate = {
				mode: "done",
				remainingHidden: asNumber(debateRow.remainingHidden),
			};
		}
	}

	return {
		sessionId: asString(row.session_id),
		materialId: asNullString(row.material_id),
		range: asNullString(row.range),
		status: row.status as Database["public"]["Enums"]["session_status"],
		moderatorId: typeof row.moderator_id === "string" ? row.moderator_id : null,
		asOf,
		roomStage:
			(row.room_stage as Database["public"]["Enums"]["room_stage"]) ??
			"questions",
		participants,
		questions,
		readiness,
		draw,
		assignments,
		debate,
		cierre: parseCierre(row.cierre),
	};
}

/** Pendientes del checklist de Cierre — null cuando roomStage !== 'cierre'. */
function parseCierre(row: Json | undefined | null): RoomCierreSnapshot | null {
	if (!row || typeof row !== "object" || Array.isArray(row)) return null;
	const c = row as Record<string, Json | undefined>;
	return {
		openTrivia: asNumber(c.open_trivia),
		openTakes: asNumber(c.open_takes),
	};
}
