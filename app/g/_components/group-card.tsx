"use client";

import Link from "next/link";
import { MemberAvatar } from "@/components/member-avatar";
import type { MyGroup } from "@/lib/groups/types";

export function GroupCard({ group }: { group: MyGroup }) {
	return (
		<Link
			href={`/g/${group.slug}`}
			className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
		>
			<div className="flex items-center gap-3">
				<MemberAvatar name={group.name} avatar={group.avatar} />
				<div className="min-w-0">
					<p className="truncate font-semibold">{group.name}</p>
					<p className="text-sm text-muted-foreground">
						{group.online_count === 0
							? "Nadie en línea ahora"
							: `${group.online_count} en línea`}
						{" · "}
						{group.role === "admin" ? "Administras" : "Miembro"}
					</p>
				</div>
			</div>
		</Link>
	);
}
