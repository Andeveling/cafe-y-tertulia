"use server";

import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
	const supabase = await createServerClient();
	const email = String(formData.get("email") ?? "")
		.trim()
		.toLowerCase();

	if (!email) {
		redirect("/auth/reset?error=invalid");
	}

	// Anti-enumeration: resetPasswordForEmail never reveals whether the email
	// exists. Same response regardless.
	await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
	});

	redirect("/auth/reset?sent=1");
}
