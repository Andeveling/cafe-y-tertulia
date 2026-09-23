import { redirect } from "next/navigation";
import { StartBoard } from "@/app/_components/start-board";
import { getMaterialOptions, getOpenSessions } from "@/app/_lib/home";
import { getCurrentMember } from "@/lib/current-member";
import { getGroupBySlug, getGroupRoster } from "@/lib/groups/queries";

export const metadata = { title: "Sesiones · Café y Tertulia" };

export default async function GroupSessionsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const { member, supabase } = await getCurrentMember();
	if (!member) redirect("/auth/login");
	if (member.status !== "active") redirect("/auth/invite");

	const group = await getGroupBySlug(supabase, slug, member.id);
	if (!group || group.role == null) redirect("/g");

	const [sessions, materials, roster] = await Promise.all([
		getOpenSessions(supabase, group.id),
		getMaterialOptions(supabase, group.id),
		getGroupRoster(supabase, group.id),
	]);

	return (
		<StartBoard
			sessions={sessions}
			materials={materials}
			displayName={member.display_name || "Miembro"}
			rosterMembers={roster}
			userId={member.id}
			groupId={group.id}
		/>
	);
}
