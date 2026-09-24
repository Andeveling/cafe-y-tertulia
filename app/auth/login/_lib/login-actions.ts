"use server";

import { redirect } from "next/navigation";
import { parseForm } from "@/app/_lib/form-helpers";
import { memberRedirect, safeNextPath, withNext } from "@/lib/auth/redirect";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { loginSchema } from "../_schemas/login-schema";

export async function signIn(formData: FormData) {
	const rawNext = formData.get("next");
	const next = safeNextPath(typeof rawNext === "string" ? rawNext : undefined);
	const parsed = await parseForm(loginSchema, formData);
	if (!parsed.ok) {
		redirect(withNext("/auth/login?error=invalid", next));
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

	// Solo `activo` entra (ADR-0014): `baja` conserva sus aportes como
	// memoria pero no entra; `invitado` migra al registro abierto.
	const { data: member } = await supabase
		.from("members")
		.select("status")
		.eq("id", data.user.id)
		.maybeSingle();

	if (!member || member.status !== "active") {
		await supabase.auth.signOut();
		redirect(memberRedirect(next, member?.status ?? null));
	}

	redirect(next);
}
