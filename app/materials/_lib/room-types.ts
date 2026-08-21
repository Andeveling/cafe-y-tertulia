/**
 * Tipos y constantes compartidos de la Sala (server + client).
 * El snapshot y la función server-only viven en room.ts.
 */
import type { Database } from "@/lib/supabase/database.types";

export type RoomStage = Database["public"]["Enums"]["room_stage"];
export type ParticipantRole = Database["public"]["Enums"]["participant_role"];
export type DrawStatus = Database["public"]["Enums"]["draw_status"];
export type AssignmentState = Database["public"]["Enums"]["assignment_state"];

export const ROOM_STAGE_ORDER: RoomStage[] = ["questions", "presence", "draw"];

export const ROOM_STAGE_LABELS: Record<RoomStage, string> = {
	questions: "Preguntas",
	presence: "Presentes",
	draw: "Sorteo",
};

export type RoomParticipant = {
	memberId: string;
	displayName: string;
	role: ParticipantRole;
	optOut: boolean;
};

export type RoomQuestion = {
	id: string;
	authorId: string;
	authorName: string;
	/** Texto solo visible para el autor (RLS + snapshot). */
	text: string | null;
	isMine: boolean;
	outsideDraw: boolean;
	createdAt: string;
};

export type RoomReadiness = {
	/** Members (no spectators) en la sesión. */
	total: number;
	/** Members con ≥1 pregunta (Listos). */
	ready: number;
	/** true si todos los members están listos. */
	allReady: boolean;
};

export type RoomDraw = {
	done: boolean;
	status: DrawStatus | null;
};

export type RoomAssignment = {
	assignmentId: string;
	questionId: string;
	authorName: string;
	assigneeName: string;
	state: AssignmentState;
	revealOrder: number;
	questionText: string | null;
	questionVisible: boolean;
};

export type RoomSnapshot = {
	sessionId: string;
	materialId: string;
	range: string;
	status: Database["public"]["Enums"]["session_status"];
	moderatorId: string | null;
	roomStage: RoomStage;
	participants: RoomParticipant[];
	questions: RoomQuestion[];
	readiness: RoomReadiness;
	draw: RoomDraw;
	assignments: RoomAssignment[];
};
