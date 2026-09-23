"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseForm } from "@/app/_lib/form-helpers";
import { getCurrentMember } from "@/lib/current-member";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { avatarSchema, displayNameSchema } from "../_schemas/profile-schema";

export type UpdateProfileState =
	| { error: "update_failed" }
	| { ok: true }
	| null;

export type UpdateAvatarState =
	| { error: "update_failed" }
	| { ok: true }
	| null;

export async function signOut() {
	const supabase = await createServerClient();
	await supabase.auth.signOut();
	redirect("/auth/login");
}

export async function updateProfile(
	_prev: UpdateProfileState,
	formData: FormData,
): Promise<UpdateProfileState> {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}
	if (member.status !== "active") {
		redirect("/");
	}

	const parsed = await parseForm(displayNameSchema, formData);
	if (!parsed.ok) {
		return { error: "update_failed" };
	}

	const { displayName } = parsed.data;

	if (displayName !== member.display_name) {
		// Service role: members has no UPDATE policy (self-edit via the Data
		// API would allow self-promotion); profile edits are server-side.
		const admin = createAdminClient();
		const { error } = await admin
			.from("members")
			.update({ display_name: displayName })
			.eq("id", member.id);

		if (error) {
			return { error: "update_failed" };
		}
	}

	revalidatePath("/profile");
	return { ok: true };
}

export async function updateAvatar(
	_prev: UpdateAvatarState,
	formData: FormData,
): Promise<UpdateAvatarState> {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}
	if (member.status !== "active") {
		redirect("/");
	}

	const parsed = await parseForm(avatarSchema, formData);
	if (!parsed.ok) {
		return { error: "update_failed" };
	}

	// "" = sin avatar (iniciales).
	const avatar = parsed.data.avatar ? parsed.data.avatar : null;

	if (avatar !== member.avatar) {
		// Service role: igual que updateProfile — la edición de la fila es
		// server-side (ADR 0005).
		const admin = createAdminClient();
		const { error } = await admin
			.from("members")
			.update({ avatar })
			.eq("id", member.id);

		if (error) {
			return { error: "update_failed" };
		}
	}

	revalidatePath("/");
	revalidatePath("/profile");
	return { ok: true };
}

export async function leaveClub() {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}
	if (member.status !== "active") {
		redirect("/");
	}

	// Service role: same reason as updateProfile — the status transition is
	// server-side (ADR 0005).
	const admin = createAdminClient();
	const { error } = await admin
		.from("members")
		.update({ status: "left" })
		.eq("id", member.id);

	if (error) {
		redirect("/profile?error=leave_failed");
	}

	const supabase = await createServerClient();
	await supabase.auth.signOut();
	redirect("/auth/login?error=left");
}
