import "server-only";
import {
	findMaterialById,
	listMaterials,
	type MaterialDetail,
	type MaterialWithSessionsCount,
} from "./materials-store";

// Re-exports para compatibilidad: los consumidores existentes importan de "./materials"
export {
	MATERIAL_KIND_LABELS,
	MATERIAL_STATUS_LABELS,
	type MaterialKind,
	type MaterialStatus,
	SESSION_NEXT_STATUS,
	SESSION_STATUS_LABELS,
	type SessionStatus,
} from "./constants";
export { getClubMilestones, getMemberProfile } from "./member-profile";
export type { SessionHistory } from "./session-history";
export { getSessionHistory } from "./session-history";
export type { MaterialDetail, MaterialWithSessionsCount };

/**
 * Lista de materiales del club con su estado en el pipeline (SPEC §4.1).
 * Un Miembro sin fila en `members` (aún invitado) ve la lista vacía: el RLS
 * filtra por membresía y esto no debe romper la página (sin 500).
 *
 * Fachada sin args: el acceso a datos vive en `./materials-store` (único
 * archivo que conoce Supabase).
 */
export async function getMaterials(
	groupId: string,
): Promise<MaterialWithSessionsCount[]> {
	return listMaterials(groupId);
}

/**
 * Detalle de un Material con sus Sesiones (SPEC §4.3, cronología descendente).
 * `null` solo cuando el Material no existe (o el RLS lo oculta).
 */
export async function getMaterial(id: string): Promise<MaterialDetail | null> {
	return findMaterialById(id);
}
