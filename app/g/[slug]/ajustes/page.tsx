import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { GroupSettingsView } from "@/app/g/[slug]/_components/group-settings-view";
import { getCurrentMember } from "@/lib/current-member";
import { getGroupBySlug } from "@/lib/groups/queries";

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

	// Cast local: database.types aún no incluye groups (ver group-actions).
	const db = supabase as unknown as SupabaseClient;
	const { data: roster } = await db
		.from("group_members")
		.select("role, member:members(id, display_name, avatar)")
		.eq("group_id", group.id);

	const members =
		(
			roster as unknown as {
				role: "admin" | "member";
				member: {
					id: string;
					display_name: string;
					avatar: string | null;
				} | null;
			}[]
		)?.flatMap((r) =>
			r.member == null
				? []
				: [
						{
							id: r.member.id,
							display_name: r.member.display_name,
							avatar: r.member.avatar,
							role: r.role,
						},
					],
		) ?? [];

	// Cast local: database.types aún no incluye groups (ver group-actions).
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
