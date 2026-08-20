"use server";

import { redirect } from "next/navigation";
import { parseForm } from "@/app/_lib/form-helpers";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { loginSchema } from "../_schemas/login-schema";

export async function signIn(formData: FormData) {
	const parsed = await parseForm(loginSchema, formData);
	if (!parsed.ok) {
		redirect("/auth/login?error=invalid");
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
		redirect(`/auth/login?error=invalid&email=${encodeURIComponent(email)}`);
	}

	// Only members with an active membership can use the app (SPEC §2.1,
	// ADR 0005). A member who left (baja) keeps their contributions but cannot
	// sign in; an invited member must first accept the invitation.
	const { data: member } = await supabase
		.from("members")
		.select("status")
		.eq("id", data.user.id)
		.maybeSingle();

	if (!member || member.status !== "active") {
		await supabase.auth.signOut();
		redirect(
			`/auth/login?error=${member?.status === "left" ? "left" : "pending"}`,
		);
	}

	redirect("/");
}
