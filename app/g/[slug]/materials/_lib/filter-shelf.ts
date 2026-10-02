import {
	MATERIAL_KIND_LABELS,
	MATERIAL_STATUS_LABELS,
	type MaterialKind,
	type MaterialStatus,
} from "@/app/materials/_lib/constants";

/** Lo mínimo que el estante necesita para buscar y filtrar. */
export type ShelfQuery = {
	title: string;
	author: string;
	kind: MaterialKind;
	status: MaterialStatus;
};

export type ShelfKindFilter = MaterialKind | "all";
export type ShelfStatusFilter = MaterialStatus | "all";

export type ShelfFilters = {
	query: string;
	kind: ShelfKindFilter;
	status: ShelfStatusFilter;
};

export const SHELF_KINDS = Object.keys(MATERIAL_KIND_LABELS) as MaterialKind[];

export const SHELF_STATUSES = Object.keys(
	MATERIAL_STATUS_LABELS,
) as MaterialStatus[];

/** Sin tildes ni mayúsculas, para que "garcia" encuentre "García". */
export function foldShelfText(value: string): string {
	return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}

export function isShelfFiltered(filters: ShelfFilters): boolean {
	return (
		filters.query.trim() !== "" ||
		filters.kind !== "all" ||
		filters.status !== "all"
	);
}

/**
 * Cada palabra del query tiene que aparecer en título o autor.
 * Formato y estado son igualdad exacta; "all" no recorta.
 */
export function filterShelfMaterials<T extends ShelfQuery>(
	materials: T[],
	filters: ShelfFilters,
): T[] {
	const tokens = foldShelfText(filters.query).split(/\s+/).filter(Boolean);

	return materials.filter((item) => {
		if (filters.kind !== "all" && item.kind !== filters.kind) return false;
		if (filters.status !== "all" && item.status !== filters.status)
			return false;
		if (tokens.length === 0) return true;
		const haystack = foldShelfText(`${item.title} ${item.author}`);
		return tokens.every((token) => haystack.includes(token));
	});
}

/** Una sola opción no es un filtro: la fila no aporta. */
export function presentShelfKinds(materials: ShelfQuery[]): MaterialKind[] {
	const present = SHELF_KINDS.filter((kind) =>
		materials.some((item) => item.kind === kind),
	);
	return present.length > 1 ? present : [];
}

export function presentShelfStatuses(
	materials: ShelfQuery[],
): MaterialStatus[] {
	const present = SHELF_STATUSES.filter((status) =>
		materials.some((item) => item.status === status),
	);
	return present.length > 1 ? present : [];
}
