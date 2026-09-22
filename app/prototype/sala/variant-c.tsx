/**
 * C — Convocatoria
 * La Sala agrupada por dónde está cada uno: en sala, en línea,
 * ausente. Chips compactos avatar + primer nombre; el CTA convoca
 * sin salir del grupo. Misma card, tres densidades.
 */
"use client";

import { MemberAvatar } from "@/components/member-avatar";
import { PresenceEstado } from "@/components/presence-estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { convocable, firstName, isReady } from "./data";
import type { SharedProps } from "./props";

function Chip({
	id,
	displayName,
	avatar,
	online,
	inRoom,
	extra,
	action,
	you,
}: {
	id: string;
	displayName: string;
	avatar: string | null;
	online: boolean;
	inRoom: boolean;
	extra?: React.ReactNode;
	action?: React.ReactNode;
	you?: boolean;
}) {
	return (
		<li
			key={id}
			title={displayName}
			className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-1 pl-1"
		>
			<MemberAvatar
				name={displayName}
				avatar={avatar}
				size="sm"
				badge={online}
				className={inRoom ? "ring-1 ring-primary/40" : "opacity-50"}
			/>
			<span className="truncate text-sm font-medium">
				{firstName(displayName)}
			</span>
			{you && (
				<Badge variant="secondary" className="shrink-0 text-xs">
					Vos
				</Badge>
			)}
			{extra}
			{action}
		</li>
	);
}

export function VariantC({ members, youId, onConvocar }: SharedProps) {
	const inRoom = members.filter((m) => m.inRoom);
	const out = convocable(members);
	const away = members.filter((m) => !m.inRoom && !m.online);

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-8 md:px-8">
			<header className="flex items-end justify-between gap-4">
				<h1 className="font-heading text-2xl font-semibold">Quién está</h1>
				<p className="text-sm text-muted-foreground tabular-nums">
					{inRoom.length} en sala · {out.length} en línea
				</p>
			</header>

			<section aria-label="En la sala" className="flex flex-col gap-3">
				<h2 className="text-sm font-medium text-muted-foreground">
					En la sala · {inRoom.length}
				</h2>
				<ul className="flex flex-wrap gap-2">
					{inRoom.map((m) => (
						<Chip
							key={m.id}
							id={m.id}
							displayName={m.displayName}
							avatar={m.avatar}
							online={m.online}
							inRoom
							you={m.id === youId}
							extra={
								m.isModerator ? (
									<Badge variant="secondary" className="shrink-0 text-xs">
										Modera
									</Badge>
								) : m.role === "spectator" ? (
									<Badge variant="outline" className="shrink-0 text-xs">
										Mira
									</Badge>
								) : (
									<Badge
										variant={isReady(m) ? "secondary" : "outline"}
										className="shrink-0 text-xs"
									>
										{isReady(m) ? "Listo" : "Falta"}
									</Badge>
								)
							}
						/>
					))}
				</ul>
				{inRoom.length === 0 && (
					<p className="text-sm text-muted-foreground">
						Sala vacía. Convoca a alguien en línea.
					</p>
				)}
			</section>

			<section aria-label="En línea" className="flex flex-col gap-3">
				<h2 className="text-sm font-medium text-muted-foreground">
					En línea · {out.length}
				</h2>
				<ul className="flex flex-wrap gap-2">
					{out.map((m) => (
						<Chip
							key={m.id}
							id={m.id}
							displayName={m.displayName}
							avatar={m.avatar}
							online
							inRoom={false}
							action={
								<Button
									size="xs"
									variant="outline"
									className="shrink-0 rounded-full"
									onClick={() => onConvocar(m.id)}
								>
									Convocar
								</Button>
							}
						/>
					))}
				</ul>
				{out.length === 0 && (
					<p className="text-sm text-muted-foreground">
						Nadie en línea fuera de sala.
					</p>
				)}
			</section>

			<section aria-label="Ausentes" className="flex flex-col gap-3">
				<h2 className="text-sm font-medium text-muted-foreground">
					Ausentes · {away.length}
				</h2>
				<ul className="flex flex-wrap gap-2 opacity-80">
					{away.map((m) => (
						<li
							key={m.id}
							title={m.displayName}
							className="flex items-center gap-2 rounded-full border border-dashed border-border/70 bg-muted/20 py-1 pr-3 pl-1"
						>
							<MemberAvatar
								name={m.displayName}
								avatar={m.avatar}
								size="sm"
								className="opacity-50"
							/>
							<span className="truncate text-sm">
								{firstName(m.displayName)}
							</span>
							<PresenceEstado estado={m.estado} />
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}
