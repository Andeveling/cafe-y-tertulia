"use server";

import { redirect } from "next/navigation";
import { parseForm } from "@/app/_lib/form-helpers";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "../_schemas/register-schema";
import { claimInvitation } from "./claim-invitation";

export type RegisterState = {
	error: "invalid" | "no_invite" | "failed";
} | null;

export async function register(
	_prev: RegisterState,
	formData: FormData,
): Promise<RegisterState> {
	const parsed = await parseForm(registerSchema, formData);
	if (!parsed.ok) return { error: "invalid" };

	const claimed = await claimInvitation(parsed.data);
	if (!claimed.ok) return { error: claimed.code };

	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({
		email: parsed.data.email.trim().toLowerCase(),
		password: parsed.data.password,
	});
	if (error) return { error: "failed" };

	redirect("/");
}
