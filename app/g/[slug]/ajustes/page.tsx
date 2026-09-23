import { notFound, redirect } from "next/navigation";
import { GroupSettingsView } from "@/app/g/[slug]/_components/group-settings-view";
import { getCurrentMember } from "@/lib/current-member";
import { getGroupBySlug, getGroupSettingsMembers } from "@/lib/groups/queries";

/**
 * /g/{slug}/ajustes — gestión del grupo, solo admin. Los miembros ven
 * solo la lista (sin controles de gestión).
 */
export default async function GroupSettingsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const { member, supabase } = await getCurrentMember();

	if (!member) redirect("/auth/login");
	if (member.status !== "active") redirect("/auth/invite");

	const group = await getGroupBySlug(supabase, slug, member.id);
	if (!group || group.role == null) notFound();

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
