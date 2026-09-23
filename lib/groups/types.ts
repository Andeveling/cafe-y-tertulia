export type GroupVisibility = "public" | "private";
export type GroupRole = "admin" | "member";

export type Group = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	avatar: string | null;
	visibility: GroupVisibility;
	created_by: string | null;
	created_at: string;
};

export type MyGroup = Pick<
	Group,
	"id" | "slug" | "name" | "description" | "avatar" | "visibility"
> & {
	role: GroupRole;
	/** Miembros con presencia reciente; nunca expone quién (privacidad cross-grupo). */
	online_count: number;
	member_count: number;
};

export type PublicGroupCard = Pick<
	Group,
	"id" | "slug" | "name" | "description" | "avatar" | "visibility"
> & {
	member_count: number;
	material_count: number;
	session_count: number;
};

export type GroupContextValue = {
	groupId: string;
	slug: string;
	role: GroupRole;
	name: string;
	avatar: string | null;
	visibility: GroupVisibility;
};

/** Normaliza un nombre a slug url-safe (misma regla que create_group en SQL). */
export function slugify(name: string): string {
	const ascii = name
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
	const slug = ascii.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
	return slug || "grupo";
}
