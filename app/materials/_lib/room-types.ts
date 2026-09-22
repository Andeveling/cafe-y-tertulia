/**
 * Tipos y constantes compartidos de la Sala (server + client).
 * El snapshot y la función server-only viven en room.ts.
 */
import type { Database } from "@/lib/supabase/database.types";

// TODO: quitar el cast cuando se regeneren los tipos de DB tras las migraciones
// 20260823000000_debate_en_sala.sql ('debate') y
// 20260825000000_cierre_en_sala.sql ('cierre') sobre room_stage.
export type RoomStage =
	| Database["public"]["Enums"]["room_stage"]
	| "debate"
	| "cierre";
export type ParticipantRole = Database["public"]["Enums"]["participant_role"];
export type DrawStatus = Database["public"]["Enums"]["draw_status"];
export type AssignmentState = Database["public"]["Enums"]["assignment_state"];

export const ROOM_STAGE_ORDER: RoomStage[] = [
	"questions",
	"presence",
	"draw",
	"debate",
	"cierre",
];

export const ROOM_STAGE_LABELS: Record<RoomStage, string> = {
	questions: "Preguntas",
	presence: "Presentes",
	draw: "Sorteo",
	debate: "Debate",
	cierre: "Cierre",
};

export type RoomParticipant = {
	memberId: string;
	displayName: string;
	/** Src del catálogo (`members.avatar`) o null = iniciales. */
	avatar: string | null;
	role: ParticipantRole;
	optOut: boolean;
};

export type RoomQuestion = {
	id: string;
	authorId: string;
	authorName: string;
	/** Src del catálogo (`members.avatar`) o null = iniciales. */
	authorAvatar: string | null;
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
	/** Reloj del sorteo — todos los clientes cuentan 3-2-1 desde aquí. */
	createdAt: string | null;
};

/** Snapshot del debate — solo presente cuando roomStage = 'debate'. */
export type RoomDebateSnapshot =
	| {
			mode: "active";
			assignmentId: string;
			state: AssignmentState;
			questionText: string;
			assigneeName: string;
			assigneeId: string;
			/** Src del catálogo o null = iniciales. */
			assigneeAvatar: string | null;
			authorName: string;
			/** Src del catálogo o null = iniciales. */
			authorAvatar: string | null;
			revealOrder: number;
			myNotes: string | null;
			phaseStartedAt: string;
			/** Progreso de corazones — null fuera de exposición/complemento. */
			hearts: HeartsProgress | null;
			remainingHidden: number;
			/** +1 del moderador usados en esta Intervención (tope 2). */
			extensionCount?: number;
	  }
	| {
			mode: "waiting_reveal";
			nextAssigneeName: string;
			nextAssigneeId: string;
			/** Src del catálogo o null = iniciales. */
			nextAssigneeAvatar: string | null;
			revealOrder: number;
			remainingHidden: number;
	  }
	| {
			mode: "done";
			remainingHidden: number;
	  };

/** Progreso de corazones en la fase activa (solo dispositivo propio). */
export type HeartsProgress = {
	/** Corazón del usuario actual (1-5) o null si no ha votado. */
	myHeart: number | null;
	/** Cuántos han votado hasta ahora. */
	voted: number;
	/** Total de elegibles para votar (presentes menos el evaluado). */
	eligible: number;
};

export type RoomAssignment = {
	assignmentId: string;
	questionId: string;
	authorId: string;
	assigneeId: string;
	authorName: string;
	assigneeName: string;
	/** Src del catálogo o null = iniciales. */
	authorAvatar: string | null;
	/** Src del catálogo o null = iniciales. */
	assigneeAvatar: string | null;
	state: AssignmentState;
	revealOrder: number;
	questionText: string | null;
	questionVisible: boolean;
	aprecioExpositionAvg: number | null;
	aprecioExpositionCount: number;
	aprecioComplementAvg: number | null;
	aprecioComplementCount: number;
};

/** Snapshot del cierre — solo presente cuando roomStage = 'cierre'. */
export type RoomCierreSnapshot = {
	openTrivia: number;
	openTakes: number;
};

export type RoomSnapshot = {
	sessionId: string;
	materialId: string | null;
	range: string | null;
	status: Database["public"]["Enums"]["session_status"];
	moderatorId: string | null;
	/**
	 * Reloj del fetch (ms). Un RSC más lento con asOf menor no pisa uno
	 * más nuevo ya aplicado en el cliente.
	 */
	asOf: number;
	roomStage: RoomStage;
	participants: RoomParticipant[];
	questions: RoomQuestion[];
	readiness: RoomReadiness;
	draw: RoomDraw;
	assignments: RoomAssignment[];
	/** Datos del debate — null cuando roomStage !== 'debate'. */
	debate: RoomDebateSnapshot | null;
	/** Pendientes del checklist — null cuando roomStage !== 'cierre'. */
	cierre: RoomCierreSnapshot | null;
};
