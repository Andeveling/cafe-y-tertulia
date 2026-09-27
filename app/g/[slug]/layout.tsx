import { GroupProvider } from "@/lib/groups/group-context";
import { requireGroupPage } from "@/lib/groups/page-gate";

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
	const { group } = await requireGroupPage(slug);

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
