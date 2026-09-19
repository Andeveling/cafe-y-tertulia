import "server-only";
import type {
	MaterialKind,
	MaterialStatus,
	MaterialsClient,
} from "./constants";
import type { SessionHistory } from "./session-history";

// Re-exports para compatibilidad: los consumidores existentes importan de "./materials"
export {
	MATERIAL_KIND_LABELS,
	MATERIAL_STATUS_LABELS,
	type MaterialKind,
	type MaterialStatus,
	type MaterialsClient,
	SESSION_NEXT_STATUS,
	SESSION_STATUS_LABELS,
	type SessionStatus,
} from "./constants";
export { getClubMilestones, getMemberProfile } from "./member-profile";
export type { SessionHistory } from "./session-history";
export { getSessionHistory } from "./session-history";

export type MaterialWithSessionsCount = {
	id: string;
	title: string;
	kind: MaterialKind;
	author: string;
	status: MaterialStatus;
	created_at: string;
	image_url: string | null;
	source_url: string | null;
	sessions_count: number;
	rating_avg: number | null;
	rating_count: number;
};

export type MaterialDetail = {
	id: string;
	title: string;
	kind: MaterialKind;
	author: string;
	status: MaterialStatus;
	created_at: string;
	image_url: string | null;
	source_url: string | null;
	rating_avg: number | null;
	rating_count: number;
	sessions: (Omit<
		SessionHistory,
		| "material"
		| "questions"
		| "participants"
		| "trivia_rounds"
		| "takes"
		| "awards"
	> & { moderator_id: string | null })[];
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
			"id, title, kind, author, status, created_at, image_url, source_url, rating_avg, rating_count, sessions(id)",
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
		image_url: material.image_url,
		source_url: material.source_url,
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
			"id, title, kind, author, status, created_at, image_url, source_url, rating_avg, rating_count, sessions(id, range, status, scheduled_at, created_at, rating_avg, rating_count, moderator_id)",
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
		image_url: data.image_url,
		source_url: data.source_url,
		rating_avg: data.rating_avg,
		rating_count: data.rating_count,
		sessions: [...(data.sessions ?? [])].sort((a, b) =>
			b.created_at.localeCompare(a.created_at),
		),
	};
}
