import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/current-member";
import { GroupProvider } from "@/lib/groups/group-context";
import { getGroupBySlug, getMyGroups } from "@/lib/groups/queries";

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
	if (member.status !== "active") redirect("/auth/invite");

	const group = await getGroupBySlug(supabase, slug, member.id);
	if (!group || group.role == null) notFound();

	const myGroups = await getMyGroups(supabase, member.id);

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
			<div className="flex flex-col gap-4">
				<nav aria-label="Grupos" className="flex items-center gap-2 text-sm">
					<a href="/g" className="text-muted-foreground hover:underline">
						Mis grupos
					</a>
					<span aria-hidden className="text-muted-foreground">
						/
					</span>
					<span className="font-semibold">{group.name}</span>
				</nav>
				{children}
				<footer className="flex gap-2 text-sm">
					{myGroups
						.filter((g) => g.slug !== group.slug)
						.map((g) => (
							<a
								key={g.slug}
								href={`/g/${g.slug}`}
								className="rounded-lg border border-border px-2 py-1 hover:border-primary"
							>
								{g.name}
							</a>
						))}
				</footer>
			</div>
		</GroupProvider>
	);
}
