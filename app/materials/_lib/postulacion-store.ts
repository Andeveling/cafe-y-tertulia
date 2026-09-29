import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MaterialKind } from "./constants";
import type { NominationStatus } from "./postulacion";

export type Postulacion = {
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

const POSTULACION_SELECT =
	"id, group_id, library_item_id, proposed_by, kind, title, author, image_url, source_url, status, created_at";

/**
 * Lecturas de Postulados (#88): el Grupo solo ve lo postulado, nunca
 * bibliotecas completas (RLS `is_group_member`). Solo activas:
 * la sección muestra las activas; el sorteo (#89) leerá
 * las del formato declarado.
 */
export const listPostulaciones = cache(
	async (groupId: string): Promise<Postulacion[]> => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("material_nominations")
			.select(POSTULACION_SELECT)
			.eq("group_id", groupId)
			.eq("status", "active")
			.order("created_at", { ascending: false });

		if (error) throw error;
		return (data ?? []).map((row) => ({
			id: row.id,
			group_id: row.group_id,
			library_item_id: row.library_item_id,
			proposed_by: row.proposed_by,
			kind: row.kind as MaterialKind,
			title: row.title,
			author: row.author,
			image_url: row.image_url,
			source_url: row.source_url,
			status: row.status as NominationStatus,
			created_at: row.created_at,
		}));
	},
);
