"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginResult = { error: string } | { success: true };

export async function signIn(input: {
	email: string;
	password: string;
}): Promise<LoginResult> {
	const supabase = await createClient();

	const { error } = await supabase.auth.signInWithPassword({
		email: input.email,
		password: input.password,
	});

	if (error) {
		return { error: "Email o contraseña incorrectos" };
	}

	redirect("/materiales");
}
