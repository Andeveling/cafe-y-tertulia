import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/database.types";

// El módulo solo necesita el builder de consultas (from); así los tests pueden
// pasar un cliente mínimo sin acoplarse a SupabaseClient completo.
export type QuestionsClient = Pick<SupabaseClient<Database>, "from">;

type Db = QuestionsClient;
type QuestionRow = Tables<"questions">;

export type QuestionWithAuthor = {
	id: string;
	sessionId: string;
	materialId: string | null;
	authorId: string;
	/** Texto solo del autor; null para el resto hasta la Intervención (la magia). */
	text: string | null;
	outsideDraw: boolean;
	createdAt: string;
	authorName: string;
};

type QuestionPoolRow = QuestionRow & {
	members: { display_name: string } | null;
};

function mapPoolRow(
	row: QuestionPoolRow,
	viewerId?: string,
): QuestionWithAuthor {
	return {
		id: row.id,
		sessionId: row.session_id,
		materialId: row.material_id,
		authorId: row.author_id,
		text: viewerId != null && row.author_id === viewerId ? row.text : null,
		outsideDraw: row.outside_draw,
		createdAt: row.created_at,
		authorName: row.members?.display_name ?? "Miembro del club",
	};
}

/**
 * Pool de Preguntas de una Sesión en preparación: los demás solo ven autor y
 * estado (enviada), nunca el texto — solo su autor lo ve hasta la
 * Intervención que lo revela. Cuáles entran al Sorteo lo decide el Sorteo 1:1
 * (ADR-0008: solo presentes que no miran). Solo visible para Miembros (RLS).
 */
export async function getSessionPool(
	supabase: Db,
	sessionId: string,
	viewerId?: string,
): Promise<QuestionWithAuthor[]> {
	const { data, error } = await supabase
		.from("questions")
		.select("*, members(display_name)")
		.eq("session_id", sessionId)
		.order("created_at", { ascending: true });

	if (error) throw error;

	return ((data ?? []) as QuestionPoolRow[]).map((row) =>
		mapPoolRow(row, viewerId),
	);
}

/**
 * Pools de varias Sesiones en una sola lectura. Las claves sin Preguntas
 * quedan en `[]` — el caller no tiene que distinguir "vacío" de "ausente".
 */
export async function getSessionPools(
	supabase: Db,
	sessionIds: string[],
	viewerId?: string,
): Promise<Map<string, QuestionWithAuthor[]>> {
	const bySession = new Map<string, QuestionWithAuthor[]>();
	for (const id of sessionIds) {
		bySession.set(id, []);
	}
	if (sessionIds.length === 0) return bySession;

	const { data, error } = await supabase
		.from("questions")
		.select("*, members(display_name)")
		.in("session_id", sessionIds)
		.order("created_at", { ascending: true });

	if (error) throw error;

	for (const row of (data ?? []) as QuestionPoolRow[]) {
		const mapped = mapPoolRow(row, viewerId);
		const list = bySession.get(mapped.sessionId) ?? [];
		list.push(mapped);
		bySession.set(mapped.sessionId, list);
	}
	return bySession;
}
