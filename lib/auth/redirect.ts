import type { Database } from "@/lib/supabase/database.types";

export type MemberStatus =
	Database["public"]["Tables"]["members"]["Row"]["status"];

/**
 * Retorno post-auth seguro: solo rutas internas. Un enlace compartido gana
 * a la memoria, pero nunca a un destino externo (ADR-0014: registro abierto
 * con `next` a través de login/registro).
 */
export function safeNextPath(next: string | null | undefined): string {
	if (!next) return "/";
	if (!next.startsWith("/") || next.startsWith("//")) return "/";
	return next;
}

/**
 * Puerta de Miembro no activo (migración por redirección, no por rama nueva):
 * `baja` va a login con aviso (sus aportes quedan como memoria); el estado
 * intermedio `invitado` del padrinazgo derogado va al registro abierto.
 * El Miembro activo no redirige: vuelve al destino pedido.
 */
export function memberRedirect(
	next: string | null | undefined,
	status?: MemberStatus | null,
): string {
	if (status === "left") return "/auth/login?error=left";
	if (status === "invited") return "/auth/register";
	return safeNextPath(next);
}
