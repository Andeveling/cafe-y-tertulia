"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RosterMember } from "@/hooks/use-club-presence";
import { type BoardSession, splitSessions } from "./board-helpers";
import { ClubRoster } from "./club-roster";
import { HeroSessionCard } from "./hero-session-card";
import { SessionCreateDialog } from "./session-create-dialog";
import { SessionRow } from "./session-row";

export type { BoardSession } from "./board-helpers";

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

	const createTrigger = (
		<Button variant="outline" className="w-full sm:w-fit">
			+ Nueva sesión
		</Button>
	);

	const main = (
		<div className="flex flex-col gap-6">
			{hero ? (
				<HeroSessionCard session={hero} />
			) : (
				<Card className="rounded-lg border-border">
					<CardContent className="flex flex-col items-center gap-3 py-10 text-center">
						<p className="text-sm text-muted-foreground">
							No hay sesiones programadas ni salas abiertas.
						</p>
						<SessionCreateDialog
							trigger={<Button>Crear la primera sesión</Button>}
							materials={materials}
							displayName={displayName}
						/>
					</CardContent>
				</Card>
			)}
			{others.length > 0 && (
				<div className="overflow-hidden rounded-lg border border-border bg-card">
					<div className="border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
						También abiertas
					</div>
					<ul className="divide-y divide-border">
						{others.map((s) => (
							<SessionRow key={s.id} session={s} />
						))}
					</ul>
				</div>
			)}
			{hero && (
				<SessionCreateDialog
					trigger={createTrigger}
					materials={materials}
					displayName={displayName}
				/>
			)}
		</div>
	);

	const roster = (
		<ClubRoster
			sessions={sessions}
			rosterMembers={rosterMembers}
			userId={userId}
		/>
	);

	return (
		<div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
			<div className="hidden gap-8 md:grid md:grid-cols-[1fr_280px]">
				{main}
				{roster}
			</div>
			<div className="md:hidden">
				<Tabs defaultValue="proxima">
					<TabsList className="w-full">
						<TabsTrigger value="proxima" className="flex-1">
							Próxima
						</TabsTrigger>
						<TabsTrigger value="miembros" className="flex-1">
							Miembros
						</TabsTrigger>
					</TabsList>
					<TabsContent value="proxima">{main}</TabsContent>
					<TabsContent value="miembros">{roster}</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
