"use client";

import { ArrowRight01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { RosterMember } from "@/hooks/use-club-presence";
import { cn } from "@/lib/utils";
import {
	type BoardSession,
	matchesFilter,
	othersHeading,
	type SessionFilter,
	sessionHasBoardCta,
	splitSessions,
} from "./board-helpers";
import { BoardSessionAction } from "./board-session-action";
import { ClubRoster } from "./club-roster";
import { HeroSessionCard } from "./hero-session-card";
import { SessionCreateDialog } from "./session-create-dialog";
import { SessionRow } from "./session-row";

export type { BoardSession } from "./board-helpers";

const FILTERS: { value: SessionFilter; label: string }[] = [
	{ value: "all", label: "Todas" },
	{ value: "live", label: "En curso" },
	{ value: "scheduled", label: "Programadas" },
];

export function StartBoard({
	sessions,
	materials,
	displayName,
	rosterMembers = [],
	userId,
}: {
	sessions: BoardSession[];
	materials: { id: string; title: string }[];
	displayName: string;
	rosterMembers?: RosterMember[];
	userId?: string;
}) {
	const { hero, others } = splitSessions(sessions);
	const [filter, setFilter] = useState<SessionFilter>("all");
	const visible = others.filter((s) => matchesFilter(s, filter));

	const createTrigger = (
		<Button variant="outline" className="w-full">
			<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
			Nueva sesión
		</Button>
	);

	const create = hero && (
		<div className="flex flex-col items-center gap-2">
			<SessionCreateDialog
				trigger={createTrigger}
				materials={materials}
				displayName={displayName}
			/>
			<SessionCreateDialog
				trigger={
					<Button variant="link" className="min-h-11">
						o programa una tertulia para mañana
					</Button>
				}
				materials={materials}
				displayName={displayName}
				initialMode="scheduled"
			/>
		</div>
	);

	const guide = (
		<Card>
			<CardHeader>
				<h2 className="font-heading text-lg font-medium italic">
					¿Cómo funciona una tertulia?
				</h2>
				<CardDescription>
					Tres gestos bastan para entrar en ritmo. Sin prisa, sin ruido.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ol className="flex flex-col gap-2.5">
					<li className="flex gap-3 text-sm text-muted-foreground">
						<span className="font-heading text-primary">01 —</span>
						Elige una sala y toma asiento. Se entra en silencio.
					</li>
					<li className="flex gap-3 text-sm text-muted-foreground">
						<span className="font-heading text-primary">02 —</span>
						Escucha primero: cada voz tiene hasta 3 minutos.
					</li>
					<li className="flex gap-3 text-sm text-muted-foreground">
						<span className="font-heading text-primary">03 —</span>
						Cierra con una frase que te lleves a casa.
					</li>
				</ol>
			</CardContent>
		</Card>
	);

	const main = (
		<div className="flex flex-col gap-12">
			<h1 className="sr-only">Sesiones del club</h1>
			{hero ? (
				<HeroSessionCard session={hero} />
			) : (
				<Empty className="border-border">
					<EmptyHeader>
						<EmptyTitle>La casa queda en silencio</EmptyTitle>
						<EmptyDescription>
							No hay sesiones programadas ni salas abiertas. Propón la primera y
							la casa la revisa en calma.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<SessionCreateDialog
							trigger={<Button>Crear la primera sesión</Button>}
							materials={materials}
							displayName={displayName}
						/>
					</EmptyContent>
				</Empty>
			)}
			{create ? <div className="lg:hidden">{create}</div> : null}
			{others.length > 0 && (
				<section className="flex flex-col gap-4">
					<div className="flex items-center gap-3">
						<h2 className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
							{othersHeading(others)}
						</h2>
						<Separator />
					</div>
					<ToggleGroup
						variant="outline"
						spacing={2}
						value={[filter]}
						aria-label="Filtrar sesiones"
						className="flex-wrap"
						onValueChange={(next) => {
							const v = next[0];
							if (v === "all" || v === "live" || v === "scheduled") {
								setFilter(v);
							}
						}}
					>
						{FILTERS.map((f) => (
							<ToggleGroupItem
								key={f.value}
								value={f.value}
								className="min-h-11 rounded-full px-4 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
							>
								{f.label}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
					{visible.length > 0 ? (
						<ul className="flex flex-col gap-3.5">
							{visible.map((s) => (
								<SessionRow key={s.id} session={s} />
							))}
						</ul>
					) : (
						<Empty className="border-dashed">
							<EmptyHeader>
								<EmptyTitle>La casa queda en silencio…</EmptyTitle>
								<EmptyDescription>
									No hay más salas en este filtro. Propón la tuya o vuelve más
									tarde.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					)}
				</section>
			)}
			<div className="lg:hidden">
				<ClubRoster
					sessions={sessions}
					rosterMembers={rosterMembers}
					userId={userId}
					collapsible
				/>
			</div>
			<div className="lg:hidden">{guide}</div>
		</div>
	);

	return (
		<div className={cn("lg:pb-0", hero && sessionHasBoardCta(hero) && "pb-28")}>
			<div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
				{main}
				<aside className="hidden flex-col gap-6 lg:flex">
					<ClubRoster
						sessions={sessions}
						rosterMembers={rosterMembers}
						userId={userId}
					/>
					{create}
					{guide}
				</aside>
			</div>
			{hero && sessionHasBoardCta(hero) ? (
				<div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
					<BoardSessionAction session={hero} variant="hero" fullWidth>
						<HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
					</BoardSessionAction>
				</div>
			) : null}
		</div>
	);
}
