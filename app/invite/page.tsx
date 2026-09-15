import { redirect } from "next/navigation";
import { InviteView } from "@/app/invite/_components/invite-view";
import type { InvitationRow } from "@/app/invite/_lib/invitation-time";
import { inviteLinkFor } from "@/app/invite/_lib/invite";
import { getCurrentMember } from "@/lib/current-member";

export default async function InvitePage({
	searchParams,
}: {
	searchParams: Promise<{
		invited?: string;
		revoked?: string;
		resent?: string;
		error?: string;
	}>;
}) {
	const params = await searchParams;
	const { supabase, member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	if (member.status !== "active") {
		redirect("/");
	}

	const { data: invitations } = await supabase
		.from("invitations")
		.select("id, email, status, expires_at, created_at")
		.eq("invited_by", member.id)
		.order("created_at", { ascending: false });

	const rows: InvitationRow[] = await Promise.all(
		(invitations ?? []).map(async (inv) => {
			if (inv.status !== "pending") return inv;
			if (Date.parse(inv.expires_at) <= Date.now()) return inv;
			return { ...inv, url: await inviteLinkFor(inv) };
		}),
	);

	const notice =
		params.invited === "1"
			? ("invited" as const)
			: params.resent === "1"
				? ("resent" as const)
				: params.revoked === "1"
					? ("revoked" as const)
					: undefined;

	return <InviteView invitations={rows} notice={notice} error={params.error} />;
}
