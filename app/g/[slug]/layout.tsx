import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/current-member";
import { GroupProvider } from "@/lib/groups/group-context";
import { getGroupBySlug } from "@/lib/groups/queries";

/**
 * Layout de /g/{slug}: resuelve el grupo, exige membresía (las privadas
 * son invisibles para no-miembros) y expone el GroupContext
 * (group_id, slug, rol, metadatos) a materiales, sala y miembros.
 */
export default async function GroupLayout({
	params,
	children,
}: {
	params: Promise<{ slug: string }>;
	children: React.ReactNode;
}) {
	const { slug } = await params;
	const { member, supabase } = await getCurrentMember();

	if (!member) redirect("/auth/login");
	if (member.status === "left") redirect("/auth/login?error=left");
	if (member.status !== "active") redirect("/auth/register");

	const group = await getGroupBySlug(supabase, slug, member.id);
	if (!group || group.role == null) notFound();

	return (
		<GroupProvider
			value={{
				groupId: group.id,
				slug: group.slug,
				role: group.role,
				name: group.name,
				avatar: group.avatar,
				visibility: group.visibility,
			}}
		>
			{children}
		</GroupProvider>
	);
}
