"use client";

import { useTransition } from "react";
import { joinGroup } from "@/app/g/_lib/group-actions";
import { MemberAvatar } from "@/components/member-avatar";
import type { PublicGroupCard } from "@/lib/groups/types";

/**
 * Catálogo de grupos públicos: nombre, descripción, avatar y conteos de
 * descubrimiento. Nunca expone contenido interno (materiales, preguntas).
 */
export function PublicCatalog({ groups }: { groups: PublicGroupCard[] }) {
	const [pending, start] = useTransition();

	if (groups.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				Aún no hay grupos públicos. Crea el tuyo para empezar.
			</p>
		);
	}

	return (
		<ul className="grid gap-3 sm:grid-cols-2">
			{groups.map((g) => (
				<li key={g.id} className="rounded-xl border border-border bg-card p-4">
					<div className="flex items-center gap-3">
						<MemberAvatar name={g.name} avatar={g.avatar} />
						<div className="min-w-0">
							<p className="truncate font-semibold">{g.name}</p>
							{g.description ? (
								<p className="truncate text-sm text-muted-foreground">
									{g.description}
								</p>
							) : null}
						</div>
					</div>
					<p className="mt-2 text-sm text-muted-foreground">
						{g.member_count} miembros · {g.material_count} materiales ·{" "}
						{g.session_count} sesiones
					</p>
					<button
						type="button"
						disabled={pending}
						onClick={() =>
							start(async () => {
								await joinGroup(g.id);
							})
						}
						className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
					>
						Unirse
					</button>
				</li>
			))}
		</ul>
	);
}
