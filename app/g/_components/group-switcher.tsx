"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MyGroup } from "@/lib/groups/types";

/** Cambia de grupo sin cerrar sesión: navega a /g/{slug}. */
export function GroupSwitcher({
	groups,
	currentSlug,
}: {
	groups: Pick<MyGroup, "slug" | "name">[];
	currentSlug: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	return (
		<div className="relative">
			<button
				type="button"
				aria-label="Cambiar de grupo"
				onClick={() => setOpen((v) => !v)}
				className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold"
			>
				Cambiar de grupo
			</button>
			{open ? (
				<ul className="absolute z-10 mt-1 min-w-44 rounded-lg border border-border bg-card p-1 shadow-lg">
					{groups.map((g) => (
						<li key={g.slug}>
							<button
								type="button"
								disabled={g.slug === currentSlug}
								onClick={() => {
									setOpen(false);
									router.push(`/g/${g.slug}`);
								}}
								className="block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-muted disabled:opacity-50"
							>
								{g.name}
							</button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
