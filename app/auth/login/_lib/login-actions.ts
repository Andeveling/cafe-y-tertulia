"use server";

import { redirect } from "next/navigation";
import { parseForm } from "@/app/_lib/form-helpers";
import { memberRedirect, safeNextPath } from "@/lib/auth/redirect";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { loginSchema } from "../_schemas/login-schema";

export async function signIn(formData: FormData) {
	const parsed = await parseForm(loginSchema, formData);
	const next = safeNextPath(
		typeof formData.get("next") === "string"
			? (formData.get("next") as string)
			: undefined,
	);
	if (!parsed.ok) {
		redirect(
			next === "/"
				? "/auth/login?error=invalid"
				: `/auth/login?error=invalid&next=${encodeURIComponent(next)}`,
		);
	}

	const email = parsed.data.email.toLowerCase();
	const password = parsed.data.password;

	const supabase = await createServerClient();
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		// Anti-enumeration: same message whether the account does not exist or
		// the password is wrong (docs/research/supabase-auth.md).
		const params = new URLSearchParams({ error: "invalid", email });
		if (next !== "/") params.set("next", next);
		redirect(`/auth/login?${params.toString()}`);
	}

	// Solo `activo` entra (ADR-0014: la cuenta es abierta, el cierre vive
	// en el Grupo). `baja` conserva sus aportes como memoria pero no entra;
	// `invitado` es el estado intermedio del padrinazgo derogado y migra al
	// registro abierto en vez de abrir una rama nueva.
	const { data: member } = await supabase
		.from("members")
		.select("status")
		.eq("id", data.user.id)
		.maybeSingle();

	if (!member || member.status !== "active") {
		await supabase.auth.signOut();
		redirect(
			memberRedirect(next === "/" ? undefined : next, member?.status ?? null),
		);
	}

	redirect(next);
}
