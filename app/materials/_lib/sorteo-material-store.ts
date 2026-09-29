import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MaterialKind } from "./constants";
import type { MaterialDrawOrigin, NominationStatus } from "./sorteo-material";

export type NominationRow = {
	id: string;
	group_id: string;
	library_item_id: string | null;
	proposed_by: string;
	kind: MaterialKind;
	title: string;
	author: string;
	image_url: string | null;
	source_url: string | null;
	status: NominationStatus;
	created_at: string;
};

export type MaterialDrawRow = {
	id: string;
	group_id: string;
	kind: MaterialKind;
	origin: MaterialDrawOrigin;
	winner_nomination_id: string | null;
	candidate_ids: string[];
	material_id: string | null;
	session_id: string | null;
	created_at: string;
};

const NOMINATION_COLUMNS =
	"id, group_id, library_item_id, proposed_by, kind, title, author, image_url, source_url, status, created_at";

const MATERIAL_DRAW_COLUMNS =
	"id, group_id, kind, origin, winner_nomination_id, candidate_ids, material_id, session_id, created_at";

/**
 * Adapter Supabase del Sorteo de Material (#89). Único que conoce Supabase:
 * la escritura resolutiva pasa por el RPC atómico `resolve_material_draw`.
 */
export const listNominations = cache(
	async (groupId: string): Promise<NominationRow[]> => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("material_nominations")
			.select(NOMINATION_COLUMNS)
			.eq("group_id", groupId)
			.order("created_at", { ascending: true });
		if (error) throw error;
		return (data ?? []).map((nomination) => ({
			id: nomination.id,
			group_id: nomination.group_id,
			library_item_id: nomination.library_item_id,
			proposed_by: nomination.proposed_by,
			kind: nomination.kind,
			title: nomination.title,
			author: nomination.author,
			image_url: nomination.image_url,
			source_url: nomination.source_url,
			status: nomination.status,
			created_at: nomination.created_at,
		}));
	},
);

export const listMaterialDraws = cache(
	async (groupId: string): Promise<MaterialDrawRow[]> => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("material_draws")
			.select(MATERIAL_DRAW_COLUMNS)
			.eq("group_id", groupId)
			.order("created_at", { ascending: false });
		if (error) throw error;
		return (data ?? []).map((draw) => ({
			id: draw.id,
			group_id: draw.group_id,
			kind: draw.kind,
			origin: draw.origin,
			winner_nomination_id: draw.winner_nomination_id,
			candidate_ids: draw.candidate_ids,
			material_id: draw.material_id,
			session_id: draw.session_id,
			created_at: draw.created_at,
		}));
	},
);
