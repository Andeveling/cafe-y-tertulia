/**
 * B — Pase de lista
 * Fila densa operativa para el Moderador: avatar + primer nombre,
 * presencia, listo y sorteo en columnas. La acción (convocar, pasar
 * a espectador) vive en la misma fila. Sin tabla fría: cada fila es
 * una card de usuario con los mismos slots que A.
 */
"use client";

import { Clock01Icon, Tick01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { MemberAvatar } from "@/components/member-avatar";
import { PresenceEstado } from "@/components/presence-estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { firstName, isReady } from "./data";
import type { SharedProps } from "./props";

export function VariantB({
	members,
	youId,
	isModeratorView,
	onConvocar,
	onToggleSpectator,
}: SharedProps) {
	const ordered = [...members].sort(
		(a, b) => Number(b.inRoom) - Number(a.inRoom),
	);
	const ready = members.filter(isReady).length;

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-8 md:px-8">
			<header className="flex items-end justify-between gap-4">
				<h1 className="font-heading text-2xl font-semibold">Pase de lista</h1>
				<p className="text-sm text-muted-foreground tabular-nums">
					{ready}/{members.filter((m) => m.inRoom).length} listos
				</p>
			</header>

			<ul aria-label="Pase de lista de la sala" className="flex flex-col gap-2">
				{ordered.map((m) => {
					const ready = isReady(m);
					const isYou = m.id === youId;
					return (
						<li
							key={m.id}
							title={m.displayName}
							className={
								isYou
									? "flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"
									: "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
							}
						>
							<MemberAvatar
								name={m.displayName}
								avatar={m.avatar}
								size="sm"
								badge={m.online && m.inRoom}
								className={m.inRoom ? undefined : "opacity-40"}
							/>
							<span className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
									<span className="truncate">{firstName(m.displayName)}</span>
									{isYou && (
										<HugeiconsIcon
											icon={UserIcon}
											className="size-3.5 text-primary"
											aria-label="Sesión activa"
										/>
									)}
									{m.isModerator && (
										<Badge variant="secondary" className="text-xs">
											Modera
										</Badge>
									)}
									{m.role === "spectator" && m.inRoom && (
										<Badge variant="outline" className="text-xs">
											Mira
										</Badge>
									)}
								</span>
								<PresenceEstado
									estado={m.estado}
									detalle={
										m.inRoom
											? undefined
											: m.online
												? "En línea · fuera de sala"
												: undefined
									}
								/>
							</span>

							<span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
								<HugeiconsIcon
									icon={ready ? Tick01Icon : Clock01Icon}
									className={
										ready ? "size-4 text-primary" : "size-4 opacity-50"
									}
									aria-hidden="true"
								/>
								{!m.inRoom
									? "fuera"
									: m.role === "spectator"
										? "espectando"
										: ready
											? "listo"
											: "falta pregunta"}
							</span>

							{!m.inRoom && m.online ? (
								<Button
									size="xs"
									variant="outline"
									onClick={() => onConvocar(m.id)}
								>
									Convocar
								</Button>
							) : isModeratorView && m.inRoom && !isYou && !m.isModerator ? (
								<Button
									size="xs"
									variant="ghost"
									onClick={() => onToggleSpectator(m.id)}
								>
									{m.role === "spectator" ? "A la mesa" : "A mirar"}
								</Button>
							) : null}
						</li>
					);
				})}
			</ul>
		</main>
	);
}
