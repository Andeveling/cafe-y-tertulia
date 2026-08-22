import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Enums } from "@/lib/supabase/database.types";

// Alineado con el resto de lectores del área: recibe el cliente por parámetro
// (inyección) y lanza ante un error real; `null`/`[]` solo para ausencia.
export type MaterialsClient = Pick<SupabaseClient<Database>, "from">;

export type MaterialStatus = Enums<"material_status">;
export type MaterialKind = Enums<"material_kind">;
export type SessionStatus = Enums<"session_status">;

export const MATERIAL_STATUS_LABELS: Record<MaterialStatus, string> = {
	proposed: "Propuesto",
	selected: "Seleccionado",
	in_progress: "En curso",
	finished: "Terminado",
};

export const MATERIAL_KIND_LABELS: Record<MaterialKind, string> = {
	book: "Libro",
	podcast: "Podcast",
	video: "Video",
	article: "Artículo",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
	preparation: "Preparación",
	lobby: "Lobby",
	in_progress: "En curso",
	closed: "Cerrada",
	archived: "Histórico",
};

/** Avance lineal del ciclo de vida de la Sesión (SPEC §3.1). Centralizado para no duplicar el mapa. */
export const SESSION_NEXT_STATUS: Record<SessionStatus, SessionStatus | null> =
	{
		preparation: "lobby",
		lobby: "in_progress",
		in_progress: "closed",
		closed: "archived",
		archived: null,
	};

export type MaterialWithSessionsCount = {
	id: string;
	title: string;
	kind: MaterialKind;
	author: string;
	status: MaterialStatus;
	created_at: string;
	sessions_count: number;
	rating_avg: number | null;
	rating_count: number;
};

export type SessionHistory = {
	id: string;
	range: string;
	status: SessionStatus;
	scheduled_at: string | null;
	created_at: string;
	rating_avg: number | null;
	rating_count: number;
	material: {
		id: string;
		title: string;
		kind: MaterialKind;
		author: string;
		status: MaterialStatus;
		rating_avg: number | null;
		rating_count: number;
	};
	participants: {
		member_id: string;
		display_name: string;
		opt_out: boolean;
	}[];
	questions: {
		id: string;
		text: string;
		author: string;
		created_at: string;
		assignment?: {
			id: string;
			assignee: string;
			state: string;
			notes: string;
		};
	}[];
	trivia_rounds: {
		id: string;
		title: string;
		status: string;
		items: {
			member_id: string;
			display_name: string;
			hits: number;
		}[];
	}[];
	takes: {
		id: string;
		prompt: string;
		status: string;
		counts: { agree: number; disagree: number; neutral: number };
	}[];
	awards: {
		id: string;
		trigger: string;
		member_id: string | null;
		display_name: string | null;
		emoji: string;
		badge_key: string;
	}[];
};

export type MaterialDetail = {
	id: string;
	title: string;
	kind: MaterialKind;
	author: string;
	status: MaterialStatus;
	created_at: string;
	rating_avg: number | null;
	rating_count: number;
	sessions: Omit<
		SessionHistory,
		| "material"
		| "questions"
		| "participants"
		| "trivia_rounds"
		| "takes"
		| "awards"
	>[];
};

/**
 * Lista de materiales del club con su estado en el pipeline (SPEC §4.1).
 * Un Miembro sin fila en `members` (aún invitado) ve la lista vacía: el RLS
 * filtra por membresía y esto no debe romper la página (sin 500).
 */
export async function getMaterials(
	supabase: MaterialsClient,
): Promise<MaterialWithSessionsCount[]> {
	const { data, error } = await supabase
		.from("materials")
		.select(
			"id, title, kind, author, status, created_at, rating_avg, rating_count, sessions(id)",
		)
		.order("created_at", { ascending: false });

	if (error) throw error;

	return (data ?? []).map((material) => ({
		id: material.id,
		title: material.title,
		kind: material.kind,
		author: material.author,
		status: material.status,
		created_at: material.created_at,
		sessions_count: material.sessions?.length ?? 0,
		rating_avg: material.rating_avg,
		rating_count: material.rating_count,
	}));
}

/**
 * Detalle de un Material con sus Sesiones (SPEC §4.3, cronología descendente).
 * `null` solo cuando el Material no existe (o el RLS lo oculta).
 */
export async function getMaterial(
	supabase: MaterialsClient,
	id: string,
): Promise<MaterialDetail | null> {
	const { data, error } = await supabase
		.from("materials")
		.select(
			"id, title, kind, author, status, created_at, rating_avg, rating_count, sessions(id, range, status, scheduled_at, created_at, rating_avg, rating_count)",
		)
		.eq("id", id)
		.single();

	if (error) throw error;

	return {
		id: data.id,
		title: data.title,
		kind: data.kind,
		author: data.author,
		status: data.status,
		created_at: data.created_at,
		rating_avg: data.rating_avg,
		rating_count: data.rating_count,
		sessions: [...(data.sessions ?? [])].sort((a, b) =>
			b.created_at.localeCompare(a.created_at),
		),
	};
}

/** Perfil público de un Miembro con sus insignias. */
export async function getMemberProfile(
	supabase: MaterialsClient,
	memberId: string,
): Promise<{
	id: string;
	display_name: string;
	awards: {
		id: string;
		emoji: string;
		badge_key: string;
		trigger: string;
		session_id: string | null;
		created_at: string;
	}[];
} | null> {
	const { data: member, error } = await supabase
		.from("members")
		.select("id, display_name")
		.eq("id", memberId)
		.single();

	if (error || !member) return null;

	const { data: awards } = await supabase
		.from("awards")
		.select("id, trigger, session_id, created_at, badges(key, emoji)")
		.eq("member_id", memberId)
		.order("created_at", { ascending: false });

	return {
		id: member.id,
		display_name: member.display_name,
		awards: (awards ?? []).map((a) => ({
			id: a.id,
			emoji: a.badges?.emoji ?? "🏆",
			badge_key: a.badges?.key ?? "",
			trigger: a.trigger,
			session_id: a.session_id,
			created_at: a.created_at,
		})),
	};
}

/** Hitos colectivos del club (badges con kind = 'collective'). */
export async function getClubMilestones(supabase: MaterialsClient): Promise<
	{
		id: string;
		emoji: string;
		badge_key: string;
		trigger: string;
		created_at: string;
	}[]
> {
	const { data } = await supabase
		.from("awards")
		.select("id, trigger, created_at, badges(key, emoji, kind)")
		.is("member_id", null)
		.order("created_at", { ascending: false });

	return (data ?? [])
		.filter((a) => a.badges?.kind === "collective")
		.map((a) => ({
			id: a.id,
			emoji: a.badges?.emoji ?? "🏆",
			badge_key: a.badges?.key ?? "",
			trigger: a.trigger,
			created_at: a.created_at,
		}));
}

/** Lectura de una Sesión para el Histórico: preguntas, participantes, asignaciones, minijuegos y logros. */
export async function getSessionHistory(
	supabase: MaterialsClient,
	id: string,
): Promise<SessionHistory | null> {
	const { data, error } = await supabase
		.from("sessions")
		.select(
			"id, range, status, scheduled_at, created_at, rating_avg, rating_count, materials(id, title, kind, author, status, rating_avg, rating_count), questions(id, text, created_at, members(display_name))",
		)
		.eq("id", id)
		.single();

	if (error) throw error;
	if (!data || !data.materials) return null;

	const sessionId = data.id;

	// Participantes (join con members para display_name)
	const { data: participants } = await supabase
		.from("session_participants")
		.select("member_id, opt_out, members(display_name)")
		.eq("session_id", sessionId);

	// Asignaciones (join con questions + members para autor y asignado)
	// !assignments_assignee_id_fkey y !questions_author_id_fkey desambiguan
	// los dos caminos a members (asignado vía assignee_id, autor vía author_id).
	const { data: assignments } = await supabase
		.from("assignments")
		.select(
			"id, question_id, state, notes, reveal_order, questions(id, text, created_at, author_id, members!questions_author_id_fkey(display_name)), members!assignments_assignee_id_fkey(display_name)",
		)
		.eq("session_id", sessionId)
		.order("reveal_order");

	// Trivia rounds + hits agregados
	const { data: rounds } = await supabase
		.from("trivia_rounds")
		.select(
			"id, status, trivias(title), trivia_hits(member_id, hits, members(display_name))",
		)
		.eq("session_id", sessionId)
		.order("created_at");

	// Takes + conteo de votos (agregado, no individual)
	const { data: takes } = await supabase
		.from("takes")
		.select("id, prompt, status, take_votes(position)")
		.eq("session_id", sessionId)
		.order("created_at");

	// Awards de esta sesión
	const { data: awards } = await supabase
		.from("awards")
		.select(
			"id, trigger, member_id, badge_id, badges(key, emoji), members(display_name)",
		)
		.eq("session_id", sessionId)
		.order("created_at");

	// Indexar asignaciones por question_id para emparejar con preguntas
	const assignmentMap = new Map(
		(assignments ?? []).map((a) => [a.question_id, a]),
	);

	return {
		id: data.id,
		range: data.range,
		status: data.status,
		scheduled_at: data.scheduled_at,
		created_at: data.created_at,
		rating_avg: data.rating_avg,
		rating_count: data.rating_count,
		material: data.materials,
		participants: (participants ?? []).map((p) => ({
			member_id: p.member_id,
			display_name: p.members?.display_name ?? "Miembro del club",
			opt_out: p.opt_out,
		})),
		questions: (data.questions ?? []).map((question) => {
			const assignment = assignmentMap.get(question.id);
			return {
				id: question.id,
				text: question.text,
				created_at: question.created_at,
				author: question.members?.display_name ?? "Miembro del club",
				...(assignment
					? {
							assignment: {
								id: assignment.id,
								assignee:
									assignment.members?.display_name ?? "Miembro del club",
								state: assignment.state,
								notes: assignment.notes,
							},
						}
					: {}),
			};
		}),
		trivia_rounds: (rounds ?? []).map((round) => ({
			id: round.id,
			title: round.trivias?.title ?? "Trivia",
			status: round.status,
			items: (round.trivia_hits ?? []).map((hit) => ({
				member_id: hit.member_id,
				display_name: hit.members?.display_name ?? "Miembro del club",
				hits: hit.hits,
			})),
		})),
		takes: (takes ?? []).map((take) => {
			const votes = take.take_votes ?? [];
			return {
				id: take.id,
				prompt: take.prompt,
				status: take.status,
				counts: {
					agree: votes.filter((v) => v.position === "agree").length,
					disagree: votes.filter((v) => v.position === "disagree").length,
					neutral: votes.filter((v) => v.position === "neutral").length,
				},
			};
		}),
		awards: (awards ?? []).map((award) => ({
			id: award.id,
			trigger: award.trigger,
			member_id: award.member_id,
			display_name: award.members?.display_name ?? null,
			emoji: award.badges?.emoji ?? "🏆",
			badge_key: award.badges?.key ?? "",
		})),
	};
}
