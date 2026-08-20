"use server";

import { redirect } from "next/navigation";
import { parseForm } from "@/app/_lib/form-helpers";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { resetSchema } from "../_schemas/reset-schema";

export async function requestPasswordReset(formData: FormData) {
	const parsed = await parseForm(resetSchema, formData);
	if (!parsed.ok) {
		redirect("/auth/reset?error=invalid");
	}

	const email = parsed.data.email.toLowerCase();
	const supabase = await createServerClient();

	// Anti-enumeration: resetPasswordForEmail never reveals whether the email
	// exists. Same response regardless.
	await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
	});

	redirect("/auth/reset?sent=1");
}
