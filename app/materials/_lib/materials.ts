import "server-only";

import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

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
	questions: {
		id: string;
		text: string;
		author: string;
		created_at: string;
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
	sessions: Omit<SessionHistory, "material" | "questions">[];
};

/**
 * Lista de materiales del club con su estado en el pipeline (SPEC §4.1).
 * Un Miembro sin fila en `members` (aún invitado) ve la lista vacía: el RLS
 * filtra por membresía y esto no debe romper la página (sin 500).
 */
export async function getMaterials(): Promise<MaterialWithSessionsCount[]> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("materials")
		.select(
			"id, title, kind, author, status, created_at, rating_avg, rating_count, sessions(id)",
		)
		.order("created_at", { ascending: false });

	if (error) {
		return [];
	}

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
 */
export async function getMaterial(id: string): Promise<MaterialDetail | null> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("materials")
		.select(
			"id, title, kind, author, status, created_at, rating_avg, rating_count, sessions(id, range, status, scheduled_at, created_at, rating_avg, rating_count)",
		)
		.eq("id", id)
		.single();

	if (error) {
		return null;
	}

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

/** Lectura de una Sesión para el Histórico, incluyendo sus Preguntas y autores. */
export async function getSessionHistory(
	id: string,
): Promise<SessionHistory | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("sessions")
		.select(
			"id, range, status, scheduled_at, created_at, rating_avg, rating_count, materials(id, title, kind, author, status, rating_avg, rating_count), questions(id, text, created_at, members(display_name))",
		)
		.eq("id", id)
		.single();

	if (error || !data || !data.materials) return null;

	return {
		id: data.id,
		range: data.range,
		status: data.status,
		scheduled_at: data.scheduled_at,
		created_at: data.created_at,
		rating_avg: data.rating_avg,
		rating_count: data.rating_count,
		material: data.materials,
		questions: (data.questions ?? []).map((question) => ({
			id: question.id,
			text: question.text,
			created_at: question.created_at,
			author: question.members?.display_name ?? "Miembro del club",
		})),
	};
}
