/** Cookie del último Grupo visitado. No es un grupo por defecto. */
export const LAST_GROUP_COOKIE = "last_group_slug";

const RESERVED_SLUGS = new Set(["join"]);

export type GroupSection = "home" | "sessions" | "materials" | "settings";

/** Slug de `/g/{slug}/…`, o null si la ruta no es un Grupo. */
export function slugFromGroupPath(pathname: string): string | null {
	const match = pathname.match(/^\/g\/([^/]+)/);
	if (!match) return null;
	const slug = decodeURIComponent(match[1]);
	if (RESERVED_SLUGS.has(slug)) return null;
	return slug;
}

/** Sección para conservar al cambiar de Grupo. Un formulario vuelve a la lista. */
export function sectionFromGroupPath(pathname: string): GroupSection {
	if (/^\/g\/[^/]+\/materials(?:\/|$)/.test(pathname)) return "materials";
	if (/^\/g\/[^/]+\/sessions(?:\/|$)/.test(pathname)) return "sessions";
	if (/^\/g\/[^/]+\/settings(?:\/|$)/.test(pathname)) return "settings";
	return "home";
}

export function hrefForGroup(slug: string, section: GroupSection): string {
	if (section === "materials") return `/g/${slug}/materials`;
	if (section === "sessions") return `/g/${slug}/sessions`;
	if (section === "settings") return `/g/${slug}/settings`;
	return `/g/${slug}`;
}

/**
 * Dónde abre `/`. Un solo Grupo: ese. Varios y hubo visita válida: el último.
 * Varios sin memoria, o ninguno: Mis Grupos. No se inventa un default.
 */
export function landingPath(
	slugs: string[],
	remembered: string | undefined,
	section: GroupSection = "sessions",
): string {
	const slug =
		slugs.length === 1
			? slugs[0]
			: remembered && slugs.includes(remembered)
				? remembered
				: null;
	if (!slug) return "/g";
	return hrefForGroup(slug, section);
}

export type ResolvableGroup = { slug: string };

/**
 * El Grupo activo para el cromo. La URL manda; fuera de un Grupo se usa
 * la memoria. Dentro de una ruta de Grupo que no reconozco (join,
 * Grupo ajeno) no finjo un activo: devuelvo null aunque haya memoria.
 */
export function resolveActiveGroup<T extends ResolvableGroup>(
	groups: T[],
	pathname: string,
	remembered: string | null,
): T | null {
	const urlSlug = slugFromGroupPath(pathname);
	const match = groups.find((group) => group.slug === urlSlug);
	if (match) return match;
	if (/^\/g\/[^/]/.test(pathname)) return null;
	return (
		groups.find((group) => group.slug === remembered) ??
		(groups.length === 1 ? groups[0] : null)
	);
}
