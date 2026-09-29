"use server";

import { type ActionResult, runServerAction } from "@/lib/server-action";
import type { MaterialKind } from "./constants";

export type ResolveMaterialDrawResult = {
	drawId: string;
	materialId: string;
	sessionId: string;
	winnerNominationId: string;
};

export type ResolveMaterialDrawInput = {
	groupId: string;
	kind: MaterialKind;
	presentIds: string[];
	range?: string | null;
	scheduledAt?: string | null;
	slug: string;
};

export type NominateFromLibraryInput = {
	libraryItemId: string;
	groupId: string;
	slug: string;
};

export type WithdrawNominationInput = {
	nominationId: string;
	slug: string;
};

type ResolveMaterialDrawRpcRow = {
	draw_id: string;
	material_id: string;
	session_id: string;
	winner_nomination_id: string;
};

type ResolveMaterialDrawOutcome =
	| ({ ok: true } & ResolveMaterialDrawResult)
	| { ok: false; error: string };

const DEFAULT_MATERIAL_RANGE = "Por definir";

const INCOMPLETE_DRAW_ERROR =
	"No se pudo resolver el sorteo: respuesta incompleta.";

function materialsPath(slug: string): string {
	return `/g/${slug}/materiales`;
}

function normalizeMaterialRange(range?: string | null): string {
	return range?.trim() || DEFAULT_MATERIAL_RANGE;
}

function isCompleteDrawRow(row: ResolveMaterialDrawRpcRow): boolean {
	return Boolean(
		row.draw_id &&
			row.material_id &&
			row.session_id &&
			row.winner_nomination_id,
	);
}

/**
 * Sorteo de Material intra-formato (#89): el Moderador declara el formato y
 * la urna (activas de ese formato, tope 1 por presente) se resuelve en un
 * RPC atómico que clona a Material seleccionado + programa la Sesión.
 */
export async function resolveMaterialDraw(
	input: ResolveMaterialDrawInput,
): Promise<ResolveMaterialDrawOutcome> {
	// Holder (no `let` plano): la asignación ocurre dentro del closure de
	// `run` y TypeScript estrecharía un `let` a `null`. El objeto const
	// conserva la unión declarada al leerlo tras el `await`.
	const holder: { draw: ResolveMaterialDrawResult | null } = { draw: null };

	const outcome = await runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { data, error } = await supabase.rpc("resolve_material_draw", {
				p_group_id: input.groupId,
				p_kind: input.kind,
				p_present_ids: input.presentIds,
				p_range: normalizeMaterialRange(input.range),
				p_scheduled_at: input.scheduledAt ?? null,
			});
			if (error || !data) {
				return {
					ok: false,
					error: `No se pudo resolver el sorteo: ${error?.message ?? ""}`,
				};
			}
			const row = data as unknown as ResolveMaterialDrawRpcRow;
			if (!isCompleteDrawRow(row)) {
				return { ok: false, error: INCOMPLETE_DRAW_ERROR };
			}
			holder.draw = {
				drawId: row.draw_id,
				materialId: row.material_id,
				sessionId: row.session_id,
				winnerNominationId: row.winner_nomination_id,
			};
		},
		revalidate: () => [materialsPath(input.slug)],
	});

	if (!outcome.ok) return outcome;
	if (!holder.draw) {
		return { ok: false, error: INCOMPLETE_DRAW_ERROR };
	}
	return { ok: true, ...holder.draw };
}

export async function nominateFromLibrary(
	input: NominateFromLibraryInput,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("nominate_from_library", {
				p_library_item_id: input.libraryItemId,
				p_group_id: input.groupId,
			});
			if (error) {
				return { ok: false, error: error.message };
			}
		},
		revalidate: () => [materialsPath(input.slug)],
	});
}

export async function withdrawNomination(
	input: WithdrawNominationInput,
): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("withdraw_nomination", {
				p_nomination_id: input.nominationId,
			});
			if (error) {
				return { ok: false, error: error.message };
			}
		},
		revalidate: () => [materialsPath(input.slug)],
	});
}
