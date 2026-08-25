import "server-only";

import { z } from "zod";
import { jArray, jBool, jNullString, jNumber, jString } from "./snapshot-codec";

// ---------------------------------------------------------------------------
// Schemas Zod para cada sub-estructura del snapshot de Sala.
// Cada schema acepta Json (snake_case del RPC) y produce el tipo de dominio
// (camelCase). El fallback via .catch() replica el comportamiento previo de
// asString/asNumber con valores por defecto — nunca lanza, siempre decodifica.
// ---------------------------------------------------------------------------

const ParticipantSchema = z
	.object({
		member_id: jString,
		display_name: jString,
		role: jString.catch("member"),
		opt_out: jBool,
	})
	.transform((r) => ({
		memberId: r.member_id,
		displayName: r.display_name,
		role: r.role as "member" | "spectator",
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
		status: jNullString,
	})
	.transform((r) => ({
		done: r.done,
		status: r.status as string | null,
	}))
	.catch({ done: false, status: null });

const AssignmentSchema = z
	.object({
		assignment_id: jString,
		question_id: jString,
		author_name: jString,
		assignee_name: jString,
		state: jString,
		reveal_order: jNumber,
		question_text: jNullString,
		question_visible: jBool,
	})
	.transform((r) => ({
		assignmentId: r.assignment_id,
		questionId: r.question_id,
		authorName: r.author_name,
		assigneeName: r.assignee_name,
		state: r.state as
			| "hidden"
			| "preparation"
			| "exposition"
			| "complement"
			| "complete",
		revealOrder: r.reveal_order,
		questionText: r.question_text,
		questionVisible: r.question_visible,
	}));

export const RoomSnapshotSchema = z.object({
	session_id: jString,
	material_id: jNullString,
	range: jNullString,
	status: jString,
	moderator_id: jNullString.transform((v) =>
		typeof v === "string" ? v : null,
	) as unknown as z.ZodType<string | null>,
	room_stage: jString.catch("questions"),
	participants: jArray(ParticipantSchema),
	questions: jArray(QuestionSchema),
	readiness: ReadinessSchema,
	draw: DrawSchema,
	assignments: jArray(AssignmentSchema),
	debate: z.unknown().nullable().catch(null),
	cierre: z.unknown().nullable().catch(null),
});
