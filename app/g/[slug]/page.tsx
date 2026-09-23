import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { GroupSwitcher } from "@/app/g/_components/group-switcher";
import { MemberAvatar } from "@/components/member-avatar";
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
 * es global y se muestra igual en cada grupo.
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
		.select("role, member:members(id, display_name, avatar)")
		.eq("group_id", group.id);

	const members =
		(roster as unknown as {
			role: string;
			member: {
				id: string;
				display_name: string;
				avatar: string | null;
			} | null;
		}[]) ?? [];

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

			<section aria-label="Miembros" className="flex flex-col gap-2">
				<h2 className="font-serif text-lg font-semibold">
					Miembros ({members.length})
				</h2>
				<ul className="grid gap-2 sm:grid-cols-2">
					{members.map((m) =>
						m.member == null ? null : (
							<li
								key={m.member.id}
								className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
							>
								<MemberAvatar
									name={m.member.display_name}
									avatar={m.member.avatar}
									size="sm"
								/>
								<span className="text-sm font-medium">
									{m.member.display_name}
								</span>
								{m.role === "admin" ? (
									<span className="text-xs text-muted-foreground">admin</span>
								) : null}
							</li>
						),
					)}
				</ul>
			</section>

			{group.role === "admin" ? (
				<p className="text-sm text-muted-foreground">
					Administras este grupo. Los ajustes avanzados (expulsar, roles,
					borrar) llegan en el ticket de admin (#76).
				</p>
			) : null}
		</div>
	);
}
