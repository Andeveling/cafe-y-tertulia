"use server";

import { redirect } from "next/navigation";
import { parseForm } from "@/app/_lib/form-helpers";
import { safeNextPath, withNext } from "@/lib/auth/redirect";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { registerSchema } from "../_schemas/register-schema";

export type RegisterState = {
	error: "invalid" | "taken" | "failed";
} | null;

/**
 * Registro abierto (ADR-0014): cualquiera crea su cuenta de Miembro sin
 * padrino. Crea la identidad auth + la fila de Miembro en estado `activo`
 * con nombre visible, inicia sesión y vuelve al `next` (p. ej. el canje
 * /g/unirse?token=…), que gana siempre a la memoria.
 */
export async function signUp(
	_prev: RegisterState,
	formData: FormData,
): Promise<RegisterState> {
	const parsed = await parseForm(registerSchema, formData);
	if (!parsed.ok) {
		return { error: "invalid" };
	}

	const email = parsed.data.email.toLowerCase();
	const displayName = parsed.data.displayName.trim();
	const next = safeNextPath(parsed.data.next);

	const admin = createAdminClient();
	const { data: created, error: createError } =
		await admin.auth.admin.createUser({
			email,
			password: parsed.data.password,
			email_confirm: true,
			user_metadata: { display_name: displayName },
		});
	if (createError || !created.user) {
		// Sin enumeración fina: si el email ya existe, se ofrece login.
		return { error: "taken" };
	}

	const { error: memberError } = await admin.from("members").upsert(
		{
			id: created.user.id,
			status: "active",
			display_name: displayName,
		},
		{ onConflict: "id" },
	);
	if (memberError) {
		await admin.auth.admin.deleteUser(created.user.id);
		return { error: "failed" };
	}

	const supabase = await createServerClient();
	const { error: signInError } = await supabase.auth.signInWithPassword({
		email,
		password: parsed.data.password,
	});
	if (signInError) {
		const params = new URLSearchParams({ email });
		redirect(withNext(`/auth/login?${params.toString()}`, next));
	}

	redirect(next);
}
