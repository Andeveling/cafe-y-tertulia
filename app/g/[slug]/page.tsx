import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { GroupSwitcher } from "@/app/g/_components/group-switcher";
import { LeaveGroupButton } from "@/app/g/_components/leave-group-button";
import { GroupRoster } from "@/app/g/[slug]/_components/group-roster";
import { getCurrentMember } from "@/lib/current-member";
import { getGroupBySlug, getMyGroups } from "@/lib/groups/queries";

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
	if (member.status !== "active") redirect("/auth/invite");

	const [group, myGroups] = await Promise.all([
		getGroupBySlug(supabase, slug, member.id),
		getMyGroups(supabase, member.id),
	]);
	if (!group || group.role == null) notFound();

	// Cast local: database.types aún no incluye groups (ver group-actions).
	const db = supabase as unknown as SupabaseClient;
	const { data: roster } = await db
		.from("group_members")
		.select("role, member:members(id, display_name, avatar, last_seen)")
		.eq("group_id", group.id);

	const members = (
		(roster as unknown as {
			role: "admin" | "member";
			member: {
				id: string;
				display_name: string;
				avatar: string | null;
				last_seen: string | null;
			} | null;
		}[]) ?? []
	).flatMap((r) =>
		r.member == null
			? []
			: [
					{
						id: r.member.id,
						display_name: r.member.display_name,
						avatar: r.member.avatar,
						last_seen: r.member.last_seen,
						role: r.role,
					},
				],
	);

	return (
		<div className="flex flex-col gap-6">
			<header className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-serif text-2xl font-semibold">{group.name}</h1>
					{group.description ? (
						<p className="text-sm text-muted-foreground">{group.description}</p>
					) : null}
				</div>
				<GroupSwitcher groups={myGroups} currentSlug={group.slug} />
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
