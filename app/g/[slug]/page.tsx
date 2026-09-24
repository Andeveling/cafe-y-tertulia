import { notFound, redirect } from "next/navigation";
import { LeaveGroupButton } from "@/app/g/_components/leave-group-button";
import { GroupRoster } from "@/app/g/[slug]/_components/group-roster";
import { inactiveMemberDestination } from "@/lib/auth/redirect";
import { getCurrentMember } from "@/lib/current-member";
import { getGroupBySlug, getGroupRoster } from "@/lib/groups/queries";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	return { title: `${slug} · Café y Tertulia` };
}

/**
 * /g/{slug} — hogar del grupo. Todo lo visible (materiales, sesiones,
 * miembros) está scopeado al grupo del layout; la identidad (nombre/avatar)
 * es global y se muestra igual en cada grupo. La presencia es del canal
 * group-{id}-roster: aquí solo se ve a este grupo.
 */
export default async function GroupHomePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const { member, supabase } = await getCurrentMember();

	if (!member) redirect("/auth/login");
	const inactiveDestination = inactiveMemberDestination(member.status);
	if (inactiveDestination) redirect(inactiveDestination);

	const group = await getGroupBySlug(supabase, slug, member.id);
	if (!group || group.role == null) notFound();

	const members = await getGroupRoster(supabase, group.id);

	return (
		<div className="flex flex-col gap-6">
			<header className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-serif text-2xl font-semibold">{group.name}</h1>
					{group.description ? (
						<p className="text-sm text-muted-foreground">{group.description}</p>
					) : null}
				</div>
			</header>

			<GroupRoster groupId={group.id} members={members} userId={member.id} />

			<LeaveGroupButton groupId={group.id} />

			{group.role === "admin" ? (
				<p className="text-sm text-muted-foreground">
					Administras este grupo.{" "}
					<a
						href={`/g/${group.slug}/ajustes`}
						className="underline underline-offset-2"
					>
						Abrir ajustes
					</a>
				</p>
			) : null}
		</div>
	);
}
