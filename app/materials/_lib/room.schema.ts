import "server-only";

import { z } from "zod";
import type { Database, Json } from "@/lib/supabase/database.types";
import type {
	AssignmentState,
	DrawStatus,
	ParticipantRole,
	RoomCierreSnapshot,
	RoomDebateSnapshot,
	RoomSnapshot,
	RoomStage,
} from "./room-types";
import {
	decodeSnapshot,
	jArray,
	jBool,
	jNullString,
	jNumber,
	jString,
} from "./snapshot-codec";

// ---------------------------------------------------------------------------
// Único seam de decodificación del snapshot de Sala.
//
// El RPC `room_snapshot` devuelve snake_case en casi todo pero camelCase en
// el bloque `debate` (ver migración room_snapshot). Esa mezcla se normaliza
// aquí dentro: fuera solo se ve dominio camelCase. Cada schema acepta Json
// y produce el tipo de dominio; el fallback via .catch() replica el
// comportamiento previo de asString/asNumber — nunca lanza, siempre decodifica.
// ---------------------------------------------------------------------------

const AssignmentStateSchema = z
	.string()
	.catch("hidden") as unknown as z.ZodType<AssignmentState>;

const ParticipantSchema = z
	.object({
		member_id: jString,
		display_name: jString,
		// z.string() fresco: el .catch exterior debe ver el undefined —
		// apilarlo sobre jString nunca dispararía (el catch interno ya recuperó).
		role: z.string().catch("member"),
		opt_out: jBool,
	})
	.transform((r) => ({
		memberId: r.member_id,
		displayName: r.display_name,
		role: r.role as ParticipantRole,
		optOut: r.opt_out,
	}));

const QuestionSchema = z
	.object({
		id: jString,
		author_id: jString,
		author_name: jString,
		text: z.string().nullable().catch(null) as unknown as z.ZodType<
			string | null
		>,
		is_mine: jBool,
		outside_draw: jBool,
		created_at: jString,
	})
	.transform((r) => ({
		id: r.id,
		authorId: r.author_id,
		authorName: r.author_name,
		text: r.text,
		isMine: r.is_mine,
		outsideDraw: r.outside_draw,
		createdAt: r.created_at,
	}));

const ReadinessSchema = z
	.object({
		total: jNumber,
		ready: jNumber,
		all_ready: jBool,
	})
	.transform((r) => ({
		total: r.total,
		ready: r.ready,
		allReady: r.all_ready,
	}))
	.catch({ total: 0, ready: 0, allReady: false });

const DrawSchema = z
	.object({
		done: jBool,
		status: jNullString as unknown as z.ZodType<DrawStatus | null>,
		created_at: jNullString,
	})
	.transform((r) => ({
		done: r.done,
		status: r.status,
		createdAt: r.created_at,
	}))
	.catch({ done: false, status: null, createdAt: null });

const AssignmentSchema = z
	.object({
		assignment_id: jString,
		question_id: jString,
		author_id: jString,
		assignee_id: jString,
		author_name: jString,
		assignee_name: jString,
		state: AssignmentStateSchema,
		reveal_order: jNumber,
		question_text: jNullString,
		question_visible: jBool,
	})
	.transform((r) => ({
		assignmentId: r.assignment_id,
		questionId: r.question_id,
		authorId: r.author_id,
		assigneeId: r.assignee_id,
		authorName: r.author_name,
		assigneeName: r.assignee_name,
		state: r.state,
		revealOrder: r.reveal_order,
		questionText: r.question_text,
		questionVisible: r.question_visible,
	}));

// El bloque `debate` llega camelCase desde SQL (mezcla histórica del RPC);
// se valida tal cual y sale dominio camelCase sin cambios de forma.
const DebateActiveSchema = z.object({
	mode: z.literal("active"),
	assignmentId: jString,
	state: AssignmentStateSchema,
	questionText: jString,
	assigneeName: jString,
	assigneeId: jString,
	authorName: jString,
	revealOrder: jNumber,
	myNotes: jNullString,
	phaseStartedAt: jString,
	remainingHidden: jNumber,
});

const DebateWaitingSchema = z.object({
	mode: z.literal("waiting_reveal"),
	nextAssigneeName: jString,
	nextAssigneeId: jString,
	revealOrder: jNumber,
	remainingHidden: jNumber,
});

const DebateDoneSchema = z.object({
	mode: z.literal("done"),
	remainingHidden: jNumber,
});

const DebateSchema = z
	.discriminatedUnion("mode", [
		DebateActiveSchema,
		DebateWaitingSchema,
		DebateDoneSchema,
	])
	.nullable()
	.catch(null) as unknown as z.ZodType<RoomDebateSnapshot | null>;

const CierreSchema = z
	.object({
		open_trivia: jNumber,
		open_takes: jNumber,
	})
	.transform((r) => ({
		openTrivia: r.open_trivia,
		openTakes: r.open_takes,
	}))
	.nullable()
	.catch(null) as unknown as z.ZodType<RoomCierreSnapshot | null>;

/** Snapshot decodificado sin el reloj de fetch — `getRoomSnapshot` añade `asOf`. */
export type DecodedRoomSnapshot = Omit<RoomSnapshot, "asOf">;

export const RoomSnapshotSchema = z
	.object({
		session_id: jString,
		material_id: jNullString,
		range: jNullString,
		status: jString as unknown as z.ZodType<
			Database["public"]["Enums"]["session_status"]
		>,
		moderator_id: jNullString,
		room_stage: z
			.string()
			.catch("questions") as unknown as z.ZodType<RoomStage>,
		participants: jArray(ParticipantSchema),
		questions: jArray(QuestionSchema),
		readiness: ReadinessSchema,
		draw: DrawSchema,
		assignments: jArray(AssignmentSchema),
		debate: DebateSchema,
		cierre: CierreSchema,
	})
	.transform((r) => ({
		sessionId: r.session_id,
		materialId: r.material_id,
		range: r.range,
		status: r.status,
		moderatorId: r.moderator_id,
		roomStage: r.room_stage,
		participants: r.participants,
		questions: r.questions,
		readiness: r.readiness,
		draw: r.draw,
		assignments: r.assignments,
		debate: r.debate,
		cierre: r.cierre,
	})) as unknown as z.ZodType<DecodedRoomSnapshot>;

/**
 * Único seam de decodificación: Json del RPC → dominio, o null si no es
 * un objeto. Nunca lanza.
 */
export function decodeRoomSnapshot(raw: unknown): DecodedRoomSnapshot | null {
	return decodeSnapshot(raw as Json | null | undefined, RoomSnapshotSchema);
}
