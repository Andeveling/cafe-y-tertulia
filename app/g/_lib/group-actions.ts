"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
	hashGroupInviteToken,
	verifyGroupInviteToken,
} from "@/app/g/_lib/group-invite";
import { isActiveMember } from "@/app/materials/_lib/members";
import type { ActionResult } from "@/lib/server-action";
import { createAdminClient } from "@/lib/supabase/admin";
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

/**
 * Unirse a un grupo privado con enlace de invitación (JWT, patrón
 * ADR-0011): verifica firma y caducidad, comprueba que la invitación siga
 * vigente (no revocada) y une como miembro.
 */
export async function joinGroupWithToken(
	token: string,
): Promise<ActionResult & { slug?: string }> {
	const claims = await verifyGroupInviteToken(token);
	if (!claims) return { ok: false, error: "Este enlace no es válido." };
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { ok: false, error: "Debes iniciar sesión." };
	if (!(await isActiveMember(supabase, user.id))) {
		return { ok: false, error: "Debes ser miembro activo." };
	}
	const admin = createAdminClient() as unknown as SupabaseClient;
	const { data: invite } = await admin
		.from("group_invites")
		.select("id, group_id, token_hash, expires_at")
		.eq("id", claims.inviteId)
		.maybeSingle();
	const row = invite as {
		id: string;
		group_id: string;
		token_hash: string | null;
		expires_at: string;
	} | null;
	if (
		!row ||
		row.group_id !== claims.groupId ||
		row.token_hash !== hashGroupInviteToken(token) ||
		Date.parse(row.expires_at) < Date.now()
	) {
		return { ok: false, error: "Este enlace ya no vale. Pide uno nuevo." };
	}
	const { error: joinError } = await admin
		.from("group_members")
		.upsert(
			{ group_id: row.group_id, member_id: user.id, role: "member" },
			{ onConflict: "group_id,member_id" },
		);
	if (joinError) return { ok: false, error: joinError.message };
	const { data: group } = await admin
		.from("groups")
		.select("slug")
		.eq("id", row.group_id)
		.maybeSingle();
	revalidatePath("/g");
	return { ok: true, slug: (group as { slug?: string } | null)?.slug };
}
