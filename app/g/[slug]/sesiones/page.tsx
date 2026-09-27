import { redirect } from "next/navigation";
import { StartBoard } from "@/app/_components/start-board";
import { getMaterialOptions, getOpenSessions } from "@/app/_lib/home";
import { requireGroupPage } from "@/lib/groups/page-gate";
import { getGroupBySlug, getGroupRoster } from "@/lib/groups/queries";

export const metadata = { title: "Sesiones · Café y Tertulias" };

export default async function GroupSessionsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const { member, supabase, group } = await requireGroupPage(slug, {
		onMissing: "mis-grupos",
	});

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
