"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { isActiveMember } from "@/app/materials/_lib/members";
import type { ActionResult } from "@/lib/server-action";
import { createClient } from "@/lib/supabase/server";

export type CreateGroupInput = {
	name: string;
	description?: string | null;
	avatar?: string | null;
	visibility: "public" | "private";
};

export async function createGroup(
	input: CreateGroupInput,
): Promise<ActionResult & { slug?: string }> {
	const name = input.name.trim();
	if (!name) return { ok: false, error: "El nombre es obligatorio." };
	if (input.visibility !== "public" && input.visibility !== "private") {
		return { ok: false, error: "Visibilidad no válida." };
	}
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { ok: false, error: "Debes iniciar sesión." };
	if (!(await isActiveMember(supabase, user.id))) {
		return { ok: false, error: "Debes ser miembro activo." };
	}
	// Cast local: database.types aún no incluye groups (se regenera tras
	// aplicar la migración en el entorno con Supabase en vivo).
	const db = supabase as unknown as SupabaseClient;
	// Contrato convergente con #71: create_group devuelve el uuid del grupo
	// (o una fila {id} en variantes futuras); el slug lo resuelve el trigger.
	const { data, error } = await db.rpc("create_group", {
		p_name: name,
		p_description: input.description ?? null,
		p_avatar: input.avatar ?? null,
		p_visibility: input.visibility,
	});
	if (error) return { ok: false, error: error.message };
	const newId =
		typeof data === "string" ? data : (data as { id?: string } | null)?.id;
	if (!newId) return { ok: false, error: "No se pudo crear el grupo." };
	const { data: row } = await db
		.from("groups")
		.select("slug")
		.eq("id", newId)
		.maybeSingle();
	revalidatePath("/g");
	return { ok: true, slug: (row as { slug?: string } | null)?.slug };
}

/** Unirse a una pública con Unirse (las privadas fallan: solo por enlace). */
export async function joinGroup(groupId: string): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { ok: false, error: "Debes iniciar sesión." };
	if (!(await isActiveMember(supabase, user.id))) {
		return { ok: false, error: "Debes ser miembro activo." };
	}
	const db = supabase as unknown as SupabaseClient;
	const { error } = await db.rpc("join_group", { p_group_id: groupId });
	if (error) return { ok: false, error: error.message };
	revalidatePath("/g");
	return { ok: true };
}

/**
 * Salir voluntariamente. Solo borra la fila de group_members: los aportes
 * (preguntas, materiales, etc.) permanecen como memoria del grupo.
 */
export async function leaveGroup(groupId: string): Promise<ActionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { ok: false, error: "Debes iniciar sesión." };
	if (!(await isActiveMember(supabase, user.id))) {
		return { ok: false, error: "Debes ser miembro activo." };
	}
	const db = supabase as unknown as SupabaseClient;
	const { error } = await db
		.from("group_members")
		.delete()
		.eq("group_id", groupId)
		.eq("member_id", user.id);
	if (error) return { ok: false, error: error.message };
	revalidatePath("/g");
	return { ok: true };
}
