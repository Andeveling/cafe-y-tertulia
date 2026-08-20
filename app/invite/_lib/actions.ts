"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/current-member";
import { inviteMember } from "./invite";

export async function invite(formData: FormData) {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	const email = String(formData.get("email") ?? "");

	const result = await inviteMember({
		email,
		padrinoId: member.id,
		padrinoDisplayName: member.display_name,
	});

	if (!result.ok) {
		redirect(`/invite?error=${result.code}`);
	}

	revalidatePath("/invite");
	redirect("/invite?invited=1");
}
