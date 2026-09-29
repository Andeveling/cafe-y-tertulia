import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MaterialKind } from "./constants";

export type BibliotecaItem = {
	id: string;
	owner_id: string;
	title: string;
	kind: MaterialKind;
	author: string;
	image_url: string | null;
	source_url: string | null;
	motive: string | null;
	created_at: string;
};

const BIBLIOTECA_SELECT =
	"id, owner_id, title, kind, author, image_url, source_url, motive, created_at";

/**
 * Lecturas de la Biblioteca personal (#88): colección privada global por
 * Miembro, solo el dueño lee (RLS `auth.uid() = owner_id`), sin group_id.
 * Las escrituras viven en `./biblioteca-actions` (mismo reparto que
 * materials-store / materials-actions).
 */
export const listBiblioteca = cache(async (): Promise<BibliotecaItem[]> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return [];
	const { data, error } = await supabase
		.from("library_items")
		.select(BIBLIOTECA_SELECT)
		.eq("owner_id", user.id)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return (data ?? []).map((row) => ({
		id: row.id,
		owner_id: row.owner_id,
		title: row.title,
		kind: row.kind as MaterialKind,
		author: row.author,
		image_url: row.image_url,
		source_url: row.source_url,
		motive: row.motive,
		created_at: row.created_at,
	}));
});
