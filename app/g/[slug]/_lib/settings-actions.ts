"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
	groupInviteUrl,
	hashGroupInviteToken,
	signGroupInviteToken,
} from "@/app/g/_lib/group-invite";
import { isActiveMember } from "@/app/materials/_lib/members";
import type { GroupRole, GroupVisibility } from "@/lib/groups/types";
import type { ActionResult } from "@/lib/server-action";
import { createClient } from "@/lib/supabase/server";

type Db = SupabaseClient;

/** database.types aún no incluye groups: se usa el cliente sin tipar. */
function untyped(supabase: Awaited<ReturnType<typeof createClient>>): Db {
	return supabase as unknown as Db;
}

async function ownRole(
	supabase: Db,
	groupId: string,
	userId: string,
): Promise<GroupRole | null> {
	const { data } = await supabase
		.from("group_members")
		.select("role")
		.eq("group_id", groupId)
		.eq("member_id", userId)
		.maybeSingle();
	return (data as { role: GroupRole } | null)?.role ?? null;
}

async function requireGroupAdmin(groupId: string) {
	const supabase = untyped(await createClient());
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { supabase, user: null, role: null as GroupRole | null };
	if (!(await isActiveMember(supabase, user.id))) {
		return { supabase, user: null, role: null as GroupRole | null };
	}
	const role = await ownRole(supabase, groupId, user.id);
	if (role !== "admin") {
		return { supabase, user: null, role: null as GroupRole | null };
	}
	return { supabase, user, role };
}

/** Admin edita nombre/descripción/avatar y visibilidad public↔private. */
export async function updateGroup(
	groupId: string,
	input: {
		name?: string;
		description?: string | null;
		avatar?: string | null;
		visibility?: GroupVisibility;
	},
): Promise<ActionResult> {
	const { supabase, user } = await requireGroupAdmin(groupId);
	if (!user) return { ok: false, error: "Solo un administrador puede editar." };
	const patch: {
		name?: string;
		description?: string | null;
		avatar?: string | null;
		visibility?: GroupVisibility;
	} = {};
	if (input.name !== undefined) {
		const name = input.name.trim();
		if (!name) return { ok: false, error: "El nombre es obligatorio." };
		patch.name = name;
	}
	if (input.description !== undefined) patch.description = input.description;
	if (input.avatar !== undefined) patch.avatar = input.avatar;
	if (input.visibility !== undefined) {
		if (input.visibility !== "public" && input.visibility !== "private") {
			return { ok: false, error: "Visibilidad no válida." };
		}
		patch.visibility = input.visibility;
	}
	if (Object.keys(patch).length === 0) return { ok: true };
	const { error } = await supabase
		.from("groups")
		.update(patch)
		.eq("id", groupId);
	if (error) return { ok: false, error: error.message };
	revalidatePath("/g");
	return { ok: true };
}

/** Admin nombra co-admins o degrada (el RPC protege al último admin). */
export async function updateMemberRole(
	groupId: string,
	memberId: string,
	role: GroupRole,
): Promise<ActionResult> {
	const { supabase, user } = await requireGroupAdmin(groupId);
	if (!user)
		return { ok: false, error: "Solo un administrador puede cambiar roles." };
	if (role !== "admin" && role !== "member") {
		return { ok: false, error: "Rol no válido." };
	}
	const { error } = await supabase.rpc("update_member_role", {
		p_group_id: groupId,
		p_member_id: memberId,
		p_role: role,
	});
	if (error) return { ok: false, error: error.message };
	revalidatePath("/g");
	return { ok: true };
}

/** Admin expulsa: cae la membresía, los aportes permanecen. */
export async function removeMember(
	groupId: string,
	memberId: string,
): Promise<ActionResult> {
	const { supabase, user } = await requireGroupAdmin(groupId);
	if (!user)
		return { ok: false, error: "Solo un administrador puede expulsar." };
	const { error } = await supabase.rpc("remove_member", {
		p_group_id: groupId,
		p_member_id: memberId,
	});
	if (error) return { ok: false, error: error.message };
	revalidatePath("/g");
	return { ok: true };
}

/**
 * Admin borra el grupo con cascada dura. Doble confirmación: el cliente
 * exige escribir el slug del grupo y esta acción lo verifica en servidor.
 */
export async function deleteGroup(
	groupId: string,
	confirmSlug: string,
): Promise<ActionResult & { slug?: string }> {
	const { supabase, user } = await requireGroupAdmin(groupId);
	if (!user) return { ok: false, error: "Solo un administrador puede borrar." };
	const { data } = await supabase
		.from("groups")
		.select("slug")
		.eq("id", groupId)
		.maybeSingle();
	const slug = (data as { slug?: string } | null)?.slug;
	if (!slug || slug !== confirmSlug.trim()) {
		return { ok: false, error: "Escribe el slug del grupo para confirmar." };
	}
	const { error } = await supabase.rpc("delete_group", { p_group_id: groupId });
	if (error) return { ok: false, error: error.message };
	revalidatePath("/g");
	return { ok: true, slug };
}

/**
 * Admin genera el enlace de invitación al grupo privado (JWT HS256 con
 * jti = invitación, patrón ADR-0011). Regenerar invalida el anterior.
 */
export async function createInviteLink(
	groupId: string,
): Promise<ActionResult & { url?: string }> {
	const { supabase, user } = await requireGroupAdmin(groupId);
	if (!user)
		return { ok: false, error: "Solo un administrador puede invitar." };
	const { data, error } = await supabase.rpc("invite_to_group", {
		p_group_id: groupId,
	});
	if (error) return { ok: false, error: error.message };
	const inviteId = typeof data === "string" ? data : null;
	if (!inviteId) return { ok: false, error: "No se pudo crear la invitación." };
	const token = await signGroupInviteToken({ inviteId, groupId });
	const { error: hashError } = await supabase
		.from("group_invites")
		.update({ token_hash: hashGroupInviteToken(token) })
		.eq("id", inviteId);
	if (hashError) return { ok: false, error: hashError.message };
	return { ok: true, url: groupInviteUrl(token) };
}

/** Admin revoca: el enlace deja de valer y se puede invitar de nuevo. */
export async function revokeInviteLink(
	groupId: string,
	inviteId: string,
): Promise<ActionResult> {
	const { supabase, user } = await requireGroupAdmin(groupId);
	if (!user)
		return { ok: false, error: "Solo un administrador puede revocar." };
	const { error } = await supabase
		.from("group_invites")
		.delete()
		.eq("id", inviteId)
		.eq("group_id", groupId);
	if (error) return { ok: false, error: error.message };
	return { ok: true };
}
