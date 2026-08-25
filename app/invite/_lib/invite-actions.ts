"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseForm } from "@/app/_lib/form-helpers";
import { getCurrentMember } from "@/lib/current-member";
import { inviteSchema } from "../_schemas/invite-schema";
import { inviteMember, revokeInvitation } from "./invite";

export async function invite(formData: FormData) {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	const parsed = await parseForm(inviteSchema, formData);
	if (!parsed.ok) {
		redirect(`/invite?error=invalid_email`);
	}

	const result = await inviteMember({
		email: parsed.data.email,
		padrinoId: member.id,
		padrinoDisplayName: member.display_name,
	});

	if (!result.ok) {
		redirect(`/invite?error=${result.code}`);
	}

	revalidatePath("/invite");
	redirect("/invite?invited=1");
}

export async function revoke(formData: FormData) {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	const invitationId = String(formData.get("id") ?? "");
	if (!invitationId) {
		redirect("/invite?error=send_failed");
	}

	const result = await revokeInvitation({
		invitationId,
		padrinoId: member.id,
	});
	if (!result.ok) {
		redirect(`/invite?error=${result.code}`);
	}

	revalidatePath("/invite");
	redirect("/invite?revoked=1");
}
