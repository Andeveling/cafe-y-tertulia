import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Enums } from "@/lib/supabase/database.types";
import "server-only";

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
