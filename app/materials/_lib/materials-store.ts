import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MaterialKind, MaterialStatus } from "./constants";
import type { SessionHistory } from "./session-history";

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
 * Adapter Supabase del módulo Materials. Es el ÚNICO lugar que conoce el
 * cliente Supabase: los callers (pages, actions) usan la fachada sin args de
 * `./materials`. Cambiar de ORM = reescribir este archivo, nada más.
 *
 * `cache()` dedup por request (datos con RLS: nunca caché persistente).
 * Cada llamada crea su propio cliente (Fluid compute).
 */
export const listMaterials = cache(
	async (): Promise<MaterialWithSessionsCount[]> => {
		const supabase = await createClient();
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
	},
);

/**
 * `null` solo cuando el Material no existe (o el RLS lo oculta) → el caller
 * decide `notFound()`. Los errores reales sí lanzan.
 */
export const findMaterialById = cache(
	async (id: string): Promise<MaterialDetail | null> => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("materials")
			.select(
				"id, title, kind, author, status, created_at, image_url, source_url, rating_avg, rating_count, sessions(id, range, status, scheduled_at, created_at, rating_avg, rating_count, moderator_id)",
			)
			.eq("id", id)
			.maybeSingle();

		if (error) throw error;
		if (!data) return null;

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
	},
);
