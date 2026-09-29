import { notFound, redirect } from "next/navigation";
import { GroupSettingsView } from "@/app/g/[slug]/_components/group-settings-view";
import { requireGroupPage } from "@/lib/groups/page-gate";
import { getGroupBySlug, getGroupSettingsMembers } from "@/lib/groups/queries";

/**
 * /g/{slug}/settings — gestión del grupo, solo admin. Los miembros ven
 * solo la lista (sin controles de gestión).
 */
export default async function GroupSettingsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const { member, supabase, group } = await requireGroupPage(slug);

	const members = await getGroupSettingsMembers(supabase, group.id);

	return (
		<GroupSettingsView
			group={{
				id: group.id,
				slug: group.slug,
				name: group.name,
				description: group.description,
				avatar: group.avatar,
				visibility: group.visibility,
			}}
			members={members}
			role={group.role}
			userId={member.id}
		/>
	);
}
