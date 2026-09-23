"use client";

import { useMemo } from "react";
import { MemberAvatar } from "@/components/member-avatar";
import { useClubPresence } from "@/hooks/use-club-presence";
import type { GroupRole } from "@/lib/groups/types";

export type GroupRosterEntry = {
	id: string;
	display_name: string;
	avatar: string | null;
	last_seen: string | null;
	role: GroupRole;
};

/**
 * Roster del grupo con presencia en vivo del canal group-{id}-roster:
 * dentro del grupo solo se ve presencia de ese grupo.
 */
export function GroupRoster({
	groupId,
	members,
	userId,
}: {
	groupId: string;
	members: GroupRosterEntry[];
	userId: string;
}) {
	const presenceMembers = useMemo(
		() =>
			members.map((m) => ({
				id: m.id,
				display_name: m.display_name,
				avatar: m.avatar,
				last_seen: m.last_seen,
			})),
		[members],
	);
	const roleByMemberId = useMemo(
		() => new Map(members.map((m) => [m.id, m.role])),
		[members],
	);
	const roster = useClubPresence(userId, presenceMembers, { groupId });
	const onlineCount = roster.filter((m) => m.online).length;

	return (
		<section aria-label="Miembros" className="flex flex-col gap-2">
			<h2 className="font-serif text-lg font-semibold">
				Miembros ({members.length} · {onlineCount} en línea)
			</h2>
			<ul className="grid gap-2 sm:grid-cols-2">
				{roster.map((m) => (
					<li
						key={m.id}
						className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
					>
						<MemberAvatar
							name={m.display_name}
							avatar={m.avatar}
							size="sm"
							badge={m.online}
						/>
						<span className="text-sm font-medium">{m.display_name}</span>
						{roleByMemberId.get(m.id) === "admin" ? (
							<span className="text-xs text-muted-foreground">admin</span>
						) : null}
						<span className="ml-auto text-xs text-muted-foreground">
							{m.ultimaVezTexto}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}
