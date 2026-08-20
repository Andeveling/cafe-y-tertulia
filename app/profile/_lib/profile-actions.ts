"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseForm } from "@/app/_lib/form-helpers";
import { getCurrentMember } from "@/lib/current-member";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { displayNameSchema } from "../_schemas/profile-schema";

export async function signOut() {
	const supabase = await createServerClient();
	await supabase.auth.signOut();
	redirect("/auth/login");
}

export async function updateProfile(formData: FormData) {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}
	if (member.status !== "active") {
		redirect("/");
	}

	const parsed = await parseForm(displayNameSchema, formData);
	if (!parsed.ok) {
		redirect("/profile?error=update_failed");
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
			redirect("/profile?error=update_failed");
		}
	}

	revalidatePath("/profile");
	redirect("/profile?updated=1");
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
