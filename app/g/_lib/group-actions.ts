"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
	hashGroupInviteToken,
	verifyGroupInviteToken,
} from "@/app/g/_lib/group-invite";
import { isActiveMember } from "@/app/materials/_lib/members";
import type { GroupVisibility } from "@/lib/groups/types";
import type { ActionResult } from "@/lib/server-action";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreateGroupInput = {
	name: string;
	description?: string | null;
	avatar?: string | null;
	visibility: GroupVisibility;
};

function isGroupVisibility(value: unknown): value is GroupVisibility {
	return value === "public" || value === "private";
}

type Db = SupabaseClient;

/** database.types aún no incluye groups: se usa el cliente sin tipar. */
function untyped(supabase: Awaited<ReturnType<typeof createClient>>): Db {
	return supabase as unknown as Db;
}

/** Sesión + membresía activa, o el ActionResult de error correspondiente. */
async function requireActiveMember(): Promise<
	{ supabase: Db; userId: string } | { error: ActionResult }
> {
	const supabase = untyped(await createClient());
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: { ok: false, error: "Debes iniciar sesión." } };
	if (!(await isActiveMember(supabase, user.id))) {
		return { error: { ok: false, error: "Debes ser miembro activo." } };
	}
	return { supabase, userId: user.id };
}

export async function createGroup(
	input: CreateGroupInput,
): Promise<ActionResult & { slug?: string }> {
	const name = input.name.trim();
	if (!name) return { ok: false, error: "El nombre es obligatorio." };
	if (!isGroupVisibility(input.visibility)) {
		return { ok: false, error: "Visibilidad no válida." };
	}
	const session = await requireActiveMember();
	if ("error" in session) return session.error;
	const { supabase } = session;
	// Contrato convergente con #71: create_group devuelve el uuid del grupo
	// (o una fila {id} en variantes futuras); el slug lo resuelve el trigger.
	const { data, error } = await supabase.rpc("create_group", {
		p_name: name,
		p_description: input.description ?? null,
		p_avatar: input.avatar ?? null,
		p_visibility: input.visibility,
	});
	if (error) return { ok: false, error: error.message };
	const newId =
		typeof data === "string" ? data : (data as { id?: string } | null)?.id;
	if (!newId) return { ok: false, error: "No se pudo crear el grupo." };
	const { data: row } = await supabase
		.from("groups")
		.select("slug")
		.eq("id", newId)
		.maybeSingle();
	revalidatePath("/g");
	return { ok: true, slug: (row as { slug?: string } | null)?.slug };
}

/** Unirse a una pública con Unirse (las privadas fallan: solo por enlace). */
export async function joinGroup(groupId: string): Promise<ActionResult> {
	const session = await requireActiveMember();
	if ("error" in session) return session.error;
	const { supabase } = session;
	const { error } = await supabase.rpc("join_group", { p_group_id: groupId });
	if (error) return { ok: false, error: error.message };
	revalidatePath("/g");
	return { ok: true };
}

/**
 * Salir voluntariamente. Solo borra la fila de group_members: los aportes
 * (preguntas, materiales, etc.) permanecen como memoria del grupo.
 */
export async function leaveGroup(groupId: string): Promise<ActionResult> {
	const session = await requireActiveMember();
	if ("error" in session) return session.error;
	const { supabase, userId } = session;
	const { error } = await supabase
		.from("group_members")
		.delete()
		.eq("group_id", groupId)
		.eq("member_id", userId);
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
	const session = await requireActiveMember();
	if ("error" in session) return session.error;
	const { userId } = session;
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
	if (!isUsableInvite(row, claims.groupId, token)) {
		return { ok: false, error: "Este enlace ya no vale. Pide uno nuevo." };
	}
	const { error: joinError } = await admin
		.from("group_members")
		.upsert(
			{ group_id: row.group_id, member_id: userId, role: "member" },
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

type InviteRow = {
	id: string;
	group_id: string;
	token_hash: string | null;
	expires_at: string;
} | null;

/** La invitación existe, es del grupo, coincide el hash y no caducó. */
function isUsableInvite(
	row: InviteRow,
	groupId: string,
	token: string,
	now = Date.now(),
): row is NonNullable<InviteRow> {
	if (!row) return false;
	if (row.group_id !== groupId) return false;
	if (row.token_hash !== hashGroupInviteToken(token)) return false;
	return Date.parse(row.expires_at) >= now;
}
