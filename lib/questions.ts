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
	materialId: string;
	authorId: string;
	text: string;
	outsideDraw: boolean;
	createdAt: string;
	authorName: string;
};

type QuestionPoolRow = QuestionRow & {
	members: { display_name: string } | null;
};

export type CreateQuestionInput = {
	sessionId: string;
	materialId: string;
	authorId: string;
	text: string;
};

/**
 * Pool de Preguntas de una Sesión: todas las aportadas, presente o no su autor
 * (SPEC §4.1 · ADR 0001). Solo visibles para Miembros (RLS).
 */
export async function getSessionPool(
	supabase: Db,
	sessionId: string,
): Promise<QuestionWithAuthor[]> {
	const { data, error } = await supabase
		.from("questions")
		.select("*, members(display_name)")
		.eq("session_id", sessionId)
		.order("created_at", { ascending: true });

	if (error) throw error;

	const rows = (data ?? []) as QuestionPoolRow[];
	return rows.map((row) => ({
		id: row.id,
		sessionId: row.session_id,
		materialId: row.material_id,
		authorId: row.author_id,
		text: row.text,
		outsideDraw: row.outside_draw,
		createdAt: row.created_at,
		authorName: row.members?.display_name ?? "Miembro del club",
	}));
}

/**
 * Un Miembro activo aporta una Pregunta a una Sesión en `preparation`.
 * La autoría se registra y no puede falsearse (RLS: author_id = auth.uid()).
 */
export async function createQuestion(
	supabase: Db,
	input: CreateQuestionInput,
): Promise<QuestionRow | null> {
	const { data, error } = await supabase
		.from("questions")
		.insert({
			session_id: input.sessionId,
			material_id: input.materialId,
			author_id: input.authorId,
			text: input.text,
		})
		.select()
		.single();

	if (error) throw error;
	return data;
}

/**
 * Marca/desmarca "Fuera de sorteo" (duplicada o fuera de contexto). Solo el
 * moderador de la Sesión (RLS). El texto y la autoría quedan inmutables.
 */
export async function toggleOutsideDraw(
	supabase: Db,
	questionId: string,
	outsideDraw: boolean,
): Promise<void> {
	const { error } = await supabase
		.from("questions")
		.update({ outside_draw: outsideDraw })
		.eq("id", questionId);

	if (error) throw error;
}
