import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
	GroupRole,
	GroupVisibility,
	MyGroup,
	PublicGroupCard,
} from "@/lib/groups/types";

export { slugify } from "@/lib/groups/types";

type Db = SupabaseClient;

/** Ventana de presencia reciente para el conteo "en línea" por grupo. */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

type MembershipRow = {
	role: GroupRole;
	group: {
		id: string;
		slug: string;
		name: string;
		description: string | null;
		avatar: string | null;
		visibility: GroupVisibility;
	} | null;
};

type RosterRow = {
	group_id: string;
	member: { last_seen: string | null } | null;
};

type CountRow = { group_id: string };

function isOnline(lastSeen: string | null, now: number): boolean {
	if (!lastSeen) return false;
	return now - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;
}

/** Conteos por grupo desde filas {group_id} (tolerante a errores). */
function tally(rows: CountRow[] | null): Map<string, number> {
	const map = new Map<string, number>();
	for (const r of rows ?? []) {
		map.set(r.group_id, (map.get(r.group_id) ?? 0) + 1);
	}
	return map;
}

function increment(map: Map<string, number>, key: string): void {
	map.set(key, (map.get(key) ?? 0) + 1);
}

/** Filas {data, error} de Supabase → lista tolerante (error = ceros). */
function rowsOrNull(res: { data: unknown; error: unknown }): CountRow[] | null {
	if (res.error) return null;
	return res.data as CountRow[] | null;
}

/**
 * Mis grupos: solo aquellos donde soy miembro. Incluye rol, conteo de
 * miembros y presencia por grupo (cuántos en línea, sin exponer quién:
 * privacidad cross-grupo). Los conteos que fallen se degradan a 0.
 */
export async function getMyGroups(
	supabase: Db,
	memberId: string,
): Promise<MyGroup[]> {
	const { data, error } = await supabase
		.from("group_members")
		.select(
			"role, group:groups(id, slug, name, description, avatar, visibility)",
		)
		.eq("member_id", memberId)
		.order("created_at", { ascending: true });

	if (error) throw error;
	const rows = (data ?? []) as unknown as MembershipRow[];
	const mine = rows.flatMap((r) =>
		r.group == null ? [] : [{ role: r.role, group: r.group }],
	);
	if (mine.length === 0) return [];

	const ids = mine.map((m) => m.group.id);
	const idSet = new Set(ids);
	const { data: roster } = await supabase
		.from("group_members")
		.select("group_id, member:members(last_seen)")
		.in("group_id", ids);

	const now = Date.now();
	const memberCount = new Map<string, number>();
	const onlineCount = new Map<string, number>();
	const rosterRows = (roster ?? []) as unknown as RosterRow[];
	for (const r of rosterRows) {
		if (!idSet.has(r.group_id)) continue;
		increment(memberCount, r.group_id);
		if (isOnline(r.member?.last_seen ?? null, now)) {
			increment(onlineCount, r.group_id);
		}
	}

	return mine.map((m) => ({
		id: m.group.id,
		slug: m.group.slug,
		name: m.group.name,
		description: m.group.description,
		avatar: m.group.avatar,
		visibility: m.group.visibility,
		role: m.role,
		online_count: onlineCount.get(m.group.id) ?? 0,
		member_count: memberCount.get(m.group.id) ?? 0,
	}));
}

/**
 * Catálogo público: solo grupos públicos, con conteos de descubrimiento
 * (miembros/materiales/sesiones) y sin contenido interno. Los privados son
 * invisibles aquí por construcción (filtro por visibilidad). Los conteos de
 * contenido se degradan a 0 si el scope aún no existe (pre-contract).
 */
export async function getPublicCatalog(
	supabase: Db,
): Promise<PublicGroupCard[]> {
	const { data, error } = await supabase
		.from("groups")
		.select("id, slug, name, description, avatar, visibility")
		.eq("visibility", "public")
		.order("name", { ascending: true });

	if (error) throw error;
	const rows = (data ?? []) as unknown as Omit<
		PublicGroupCard,
		"member_count" | "material_count" | "session_count"
	>[];
	const pubs = rows.filter((r) => r.visibility === "public");
	if (pubs.length === 0) return [];
	const ids = pubs.map((g) => g.id);

	const [membersRes, materialsRes, sessionsRes] = await Promise.all([
		supabase.from("group_members").select("group_id").in("group_id", ids),
		supabase.from("materials").select("group_id").in("group_id", ids),
		supabase.from("sessions").select("group_id").in("group_id", ids),
	]);

	const members = tally(rowsOrNull(membersRes));
	const materials = tally(rowsOrNull(materialsRes));
	const sessions = tally(rowsOrNull(sessionsRes));

	return pubs.map((g) => ({
		...g,
		member_count: members.get(g.id) ?? 0,
		material_count: materials.get(g.id) ?? 0,
		session_count: sessions.get(g.id) ?? 0,
	}));
}

export type GroupBySlug = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	avatar: string | null;
	visibility: GroupVisibility;
	role: GroupRole | null;
};

/** Grupo por slug + rol del miembro (null si no pertenece). */
export async function getGroupBySlug(
	supabase: Db,
	slug: string,
	memberId: string,
): Promise<GroupBySlug | null> {
	const { data, error } = await supabase
		.from("groups")
		.select("id, slug, name, description, avatar, visibility")
		.eq("slug", slug)
		.maybeSingle();

	if (error) throw error;
	if (data == null) return null;
	const g = data as Omit<GroupBySlug, "role">;

	const { data: membership } = await supabase
		.from("group_members")
		.select("role")
		.eq("group_id", g.id)
		.eq("member_id", memberId)
		.maybeSingle();

	const role = (membership as { role: GroupRole } | null)?.role ?? null;
	return { ...g, role };
}

export type GroupRosterRow = {
	id: string;
	display_name: string;
	avatar: string | null;
	last_seen: string | null;
	role: GroupRole;
};

type GroupRosterDbRow = {
	role: GroupRole;
	member: {
		id: string;
		display_name: string;
		avatar: string | null;
		last_seen: string | null;
	} | null;
};

/** Miembros del grupo con presencia persistida (para GroupRoster). */
export async function getGroupRoster(
	supabase: Db,
	groupId: string,
): Promise<GroupRosterRow[]> {
	// Cast local: database.types aún no incluye groups (ver group-actions).
	const db = supabase as unknown as SupabaseClient;
	const { data } = await db
		.from("group_members")
		.select("role, member:members(id, display_name, avatar, last_seen)")
		.eq("group_id", groupId);
	const rows = (data ?? []) as unknown as GroupRosterDbRow[];
	return rows.flatMap((r) =>
		r.member == null
			? []
			: [
					{
						id: r.member.id,
						display_name: r.member.display_name,
						avatar: r.member.avatar,
						last_seen: r.member.last_seen,
						role: r.role,
					},
				],
	);
}

export type GroupSettingsMemberRow = {
	id: string;
	display_name: string;
	avatar: string | null;
	role: GroupRole;
};

type GroupSettingsMemberDbRow = {
	role: GroupRole;
	member: {
		id: string;
		display_name: string;
		avatar: string | null;
	} | null;
};

/** Miembros del grupo sin last_seen (para la página de ajustes). */
export async function getGroupSettingsMembers(
	supabase: Db,
	groupId: string,
): Promise<GroupSettingsMemberRow[]> {
	// Cast local: database.types aún no incluye groups (ver group-actions).
	const db = supabase as unknown as SupabaseClient;
	const { data } = await db
		.from("group_members")
		.select("role, member:members(id, display_name, avatar)")
		.eq("group_id", groupId);
	const rows = (data ?? []) as unknown as GroupSettingsMemberDbRow[];
	return rows.flatMap((r) =>
		r.member == null
			? []
			: [
					{
						id: r.member.id,
						display_name: r.member.display_name,
						avatar: r.member.avatar,
						role: r.role,
					},
				],
	);
}
