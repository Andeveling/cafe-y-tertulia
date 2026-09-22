/**
 * A — La Mesa
 * La Sala como mesa de tertulia: asientos en retícula, avatar grande
 * + primer nombre debajo. De un vistazo se ve quién entró y en qué
 * estado está. El nombre completo vive en `title`.
 */
"use client";

import { MemberAvatar } from "@/components/member-avatar";
import { PresenceEstado } from "@/components/presence-estado";
import { Badge } from "@/components/ui/badge";
import { firstName, isReady } from "./data";
import type { SharedProps } from "./props";

export function VariantA({ members, youId }: SharedProps) {
	const inRoom = members.filter((m) => m.inRoom);
	const ready = members.filter(isReady).length;

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-8 md:px-8">
			<header className="flex items-end justify-between gap-4">
				<h1 className="font-heading text-2xl font-semibold">La mesa</h1>
				<p className="text-sm text-muted-foreground tabular-nums">
					{inRoom.length} en sala · {ready} listos
				</p>
			</header>

			<ul
				aria-label="Participantes en la sala"
				className="grid grid-cols-2 gap-4 sm:grid-cols-3"
			>
				{inRoom.map((m) => {
					const ready = isReady(m);
					return (
						<li
							key={m.id}
							title={m.displayName}
							className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-5 text-center"
						>
							<MemberAvatar
								name={m.displayName}
								avatar={m.avatar}
								size="lg"
								badge={m.online}
								className={m.online ? "ring-1 ring-primary/40" : "opacity-60"}
							/>
							<p className="flex flex-wrap items-center justify-center gap-1.5 text-sm font-medium">
								<span className="truncate">{firstName(m.displayName)}</span>
								{m.id === youId && (
									<Badge variant="secondary" className="text-xs">
										Vos
									</Badge>
								)}
							</p>
							{m.isModerator && (
								<Badge variant="secondary" className="text-xs">
									Modera
								</Badge>
							)}
							{m.role === "spectator" ? (
								<Badge variant="outline" className="text-xs">
									Mira
								</Badge>
							) : (
								<Badge
									variant={ready ? "secondary" : "outline"}
									className="text-xs"
								>
									{ready ? "Listo" : "Falta pregunta"}
								</Badge>
							)}
							<PresenceEstado estado={m.estado} />
						</li>
					);
				})}
			</ul>

			{inRoom.length === 0 && (
				<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
					<p className="text-sm text-muted-foreground">
						Nadie tomó asiento todavía. Convoca desde fuera de la sala.
					</p>
				</div>
			)}
		</main>
	);
}
