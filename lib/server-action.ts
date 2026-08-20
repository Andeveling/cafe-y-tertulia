import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { isActiveMember } from "@/app/materials/_lib/members";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * Resultado único de toda acción de servidor del área de materiales.
 * Unificamos las dos formas previas (`{error}|{success}` y `{ok}`) en esta
 * sola: `ok: false` + mensaje, o `ok: true`. Los formularios y paneles la
 * leen con `"error" in result` / `result.ok`.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };

export type ActionContext = {
	supabase: SupabaseClient<Database>;
	user: User | null;
};

export type ServerAction = {
	/**
	 * Exige una sesión activa. Implícito si `requireMember`.
	 * Cuando el RPC ya autoriza inline (moderador, fase, membresía), se omite
	 * para no añadir una consulta extra por acción.
	 */
	requireAuth?: boolean;
	/** Además exige que el usuario sea Miembro activo (cerradura de ADR 0005). */
	requireMember?: boolean;
	/** Mensaje cuando no hay sesión. Por defecto "Debes iniciar sesión." */
	notSignedInMessage?: string;
	/** Mensaje cuando no es Miembro activo. */
	memberErrorMessage?: string;
	/**
	 * El cuerpo de la mutación. Devuelve un ActionResult para cortar (p. ej.
	 * un error de dominio), o nada para continuar hacia la revalidación y el
	 * `{ ok: true }`. Puede lanzar `redirect()`/`notFound()` si el flujo lo
	 * exige — Next.js los propaga por encima de este módulo.
	 */
	run: (
		ctx: ActionContext,
	) => Promise<ActionResult | void> | ActionResult | void;
	/** Rutas a revalidar tras una mutación exitosa. */
	revalidate?: (
		ctx: ActionContext,
	) => Promise<readonly string[]> | readonly string[];
};

/**
 * Módulo profundo que posee el ciclo completo de una acción de servidor:
 * crear el cliente → (opcional) exigir sesión/membresía → correr la mutación →
 * revalidar las rutas → devolver `ActionResult`. Concentra la cerradura y el
 * camino de éxito en un solo lugar: un guard nuevo se paga en N acciones sin
 * tocarlas. La autorización fina (moderador, fase) sigue en los RPC.
 */
export async function runServerAction(
	action: ServerAction,
): Promise<ActionResult> {
	const supabase = await createClient();

	let user: User | null = null;
	if (action.requireAuth || action.requireMember) {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();
		user = authUser;
		if (!user) {
			return {
				ok: false,
				error: action.notSignedInMessage ?? "Debes iniciar sesión.",
			};
		}
	}

	if (action.requireMember && !(await isActiveMember(supabase, user!.id))) {
		return {
			ok: false,
			error:
				action.memberErrorMessage ??
				"Solo los Miembros del club pueden realizar esta acción.",
		};
	}

	const ctx: ActionContext = { supabase, user };
	const result = await action.run(ctx);
	if (result) return result;

	if (action.revalidate) {
		const paths = await action.revalidate(ctx);
		for (const path of paths) revalidatePath(path);
	}

	return { ok: true };
}
