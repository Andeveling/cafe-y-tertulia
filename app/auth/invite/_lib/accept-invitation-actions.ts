"use server";

import { redirect } from "next/navigation";
import { parseForm } from "@/app/_lib/form-helpers";
import { acceptInviteToken } from "@/app/invite/_lib/invite";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { acceptInvitationSchema } from "../_schemas/accept-invitation-schema";

export type AcceptInvitationState = {
	error: "invalid" | "update_failed" | "invalid_or_expired" | "expired";
} | null;

/**
 * Canjea el enlace de Invitación: nombre visible + contraseña, membresía
 * activa, primer ingreso. Sin sesión previa (ADR 0011).
 */
export async function acceptInvitation(
	_prev: AcceptInvitationState,
	formData: FormData,
): Promise<AcceptInvitationState> {
	const parsed = await parseForm(acceptInvitationSchema, formData);
	if (!parsed.ok) {
		return { error: "invalid" };
	}

	const { token, email, displayName, password } = parsed.data;
	const result = await acceptInviteToken({
		token,
		email,
		displayName,
		password,
	});

	if (!result.ok) {
		if (result.code === "expired") return { error: "expired" };
		if (result.code === "failed") return { error: "update_failed" };
		return { error: "invalid_or_expired" };
	}

	const supabase = await createServerClient();
	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});
	if (error) {
		return { error: "update_failed" };
	}

	redirect("/");
}
