import "server-only";
import type { MaterialsClient } from "./constants";
import type { MasteryLevelName } from "./mastery";
import { aggregateMastery, masteryLevelFor } from "./mastery";

export type Category = {
	id: string;
	key: string;
	name: string;
	icon: string;
};

/** Todas las categorías del club, en orden alfabético. */
export async function listCategories(
	supabase: MaterialsClient,
): Promise<Category[]> {
	const { data, error } = await supabase
		.from("categories")
		.select("id, key, name, icon")
		.order("name");
	if (error) throw error;
	return data;
}

/** Categorías de un material (puente 1..N). */
export async function getMaterialCategories(
	supabase: MaterialsClient,
	materialId: string,
): Promise<Category[]> {
	const { data, error } = await supabase
		.from("material_categories")
		.select("categories(id, key, name, icon)")
		.eq("material_id", materialId);
	if (error) throw error;
	return (data ?? [])
		.map((row) => row.categories)
		.filter((c): c is Category => c !== null)
		.sort((a, b) => a.name.localeCompare(b.name));
}

export type MemberMastery = {
	category: Category;
	points: number;
	level: MasteryLevelName;
};

/**
 * Maestría de un miembro por categoría (issue #61).
 * Solo cuentan sesiones cerradas o en histórico donde participó sin ser
 * espectador. Aportar = autor de ≥1 pregunta, exposición o complemento
 * (asignado que llegó a complemento) o aciertos en trivia. Devuelve todas
 * las categorías (0 puntos = Semilla) para que el recorrido sea visible
 * desde cero.
 */
export async function getMemberMastery(
	supabase: MaterialsClient,
	memberId: string,
): Promise<MemberMastery[]> {
	const { data: parts, error: partsError } = await supabase
		.from("session_participants")
		.select("session_id")
		.eq("member_id", memberId)
		.eq("opt_out", false);
	if (partsError) throw partsError;
	const sessionIds = [...new Set((parts ?? []).map((p) => p.session_id))];

	const all = await listCategories(supabase);
	const empty = all
		.map((category) => ({ category, points: 0, level: masteryLevelFor(0) }))
		.sort((a, b) => a.category.name.localeCompare(b.category.name));
	if (sessionIds.length === 0) return empty;

	const { data: sessions, error: sessionsError } = await supabase
		.from("sessions")
		.select("id, material_id")
		.in("id", sessionIds)
		.in("status", ["closed", "archived"]);
	if (sessionsError) throw sessionsError;
	if (!sessions || sessions.length === 0) return empty;

	const withMaterial = sessions.filter((s) => s.material_id !== null);
	const withoutMaterial = sessions.filter((s) => s.material_id === null);

	const [matCats, sessCats, questions, expositions, rounds] = await Promise.all(
		[
			withMaterial.length > 0
				? supabase
						.from("material_categories")
						.select("material_id, category_id")
						.in(
							"material_id",
							withMaterial.map((s) => s.material_id as string),
						)
				: Promise.resolve({ data: [], error: null }),
			withoutMaterial.length > 0
				? supabase
						.from("session_categories")
						.select("session_id, category_id")
						.in(
							"session_id",
							withoutMaterial.map((s) => s.id),
						)
				: Promise.resolve({ data: [], error: null }),
			supabase
				.from("questions")
				.select("session_id")
				.eq("author_id", memberId)
				.in(
					"session_id",
					sessions.map((s) => s.id),
				),
			supabase
				.from("assignments")
				.select("session_id")
				.eq("assignee_id", memberId)
				.in("state", ["complement", "complete"])
				.in(
					"session_id",
					sessions.map((s) => s.id),
				),
			supabase
				.from("trivia_rounds")
				.select("id, session_id")
				.in(
					"session_id",
					sessions.map((s) => s.id),
				),
		],
	);

	for (const result of [matCats, sessCats, questions, expositions, rounds]) {
		if (result.error) throw result.error;
	}

	const categoriesBySession = new Map<string, string[]>();
	for (const s of withMaterial) {
		categoriesBySession.set(
			s.id,
			(matCats.data ?? [])
				.filter((mc) => mc.material_id === s.material_id)
				.map((mc) => mc.category_id),
		);
	}
	for (const s of withoutMaterial) {
		categoriesBySession.set(
			s.id,
			(sessCats.data ?? [])
				.filter((sc) => sc.session_id === s.id)
				.map((sc) => sc.category_id),
		);
	}

	const questionedSessions = new Set(
		(questions.data ?? []).map((q) => q.session_id),
	);
	const expositedSessions = new Set(
		(expositions.data ?? []).map((a) => a.session_id),
	);
	const roundSession = new Map(
		(rounds.data ?? []).map((r) => [r.id, r.session_id]),
	);
	const roundIds = [...roundSession.keys()];
	let hitSessions = new Set<string>();
	if (roundIds.length > 0) {
		const { data: hitRows, error: hitsError } = await supabase
			.from("trivia_hits")
			.select("round_id")
			.eq("member_id", memberId)
			.gt("hits", 0)
			.in("round_id", roundIds);
		if (hitsError) throw hitsError;
		hitSessions = new Set(
			(hitRows ?? []).map((h) => roundSession.get(h.round_id) as string),
		);
	}

	const points = aggregateMastery(
		sessions.flatMap((s) =>
			(categoriesBySession.get(s.id) ?? []).map((categoryId) => ({
				categoryId,
				participated: true,
				contributed:
					questionedSessions.has(s.id) ||
					expositedSessions.has(s.id) ||
					hitSessions.has(s.id),
			})),
		),
	);

	return all
		.map((category) => {
			const pts = points.get(category.id) ?? 0;
			return { category, points: pts, level: masteryLevelFor(pts) };
		})
		.sort(
			(a, b) =>
				b.points - a.points || a.category.name.localeCompare(b.category.name),
		);
}
