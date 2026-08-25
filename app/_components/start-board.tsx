"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { convocarAction } from "@/app/materials/_lib/convocatoria-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type RosterMember, useClubPresence } from "@/hooks/use-club-presence";
import { SessionCreateDialog } from "./session-create-dialog";

export type BoardSession = {
	id: string;
	status: "lobby" | "in_progress" | "preparation";
	scheduled_at: string | null;
	range: string | null;
	moderator_id: string | null;
	moderator_name: string | null;
	material_title: string | null;
};

function sessionTitle(s: BoardSession): string {
	if (s.range) return s.range;
	if (s.material_title) return s.material_title;
	return `Sesión de ${s.moderator_name ?? "alguien"}`;
}

function statusMeta(status: BoardSession["status"]) {
	switch (status) {
		case "lobby":
			return { label: "Sala abierta", live: true };
		case "in_progress":
			return { label: "En curso", live: true };
		default:
			return { label: "Próxima", live: false };
	}
}

function whenLabel(iso: string | null): string {
	if (!iso) return "Sin fecha";
	const d = new Date(iso);
	const now = new Date();
	const today = format(now, "yyyy-MM-dd");
	const tomorrow = format(new Date(now.getTime() + 86_400_000), "yyyy-MM-dd");
	const day = format(d, "yyyy-MM-dd");
	if (day === today) return `Hoy ${format(d, "HH:mm")}`;
	if (day === tomorrow) return `Mañana ${format(d, "HH:mm")}`;
	return format(d, "EEE d MMM, HH:mm", { locale: es });
}

function splitSessions(sessions: BoardSession[]) {
	const live = sessions.filter(
		(s) => s.status === "lobby" || s.status === "in_progress",
	);
	const scheduled = sessions.filter((s) => s.status === "preparation");
	const hero = live[0] ?? scheduled[0] ?? null;
	const others =
		hero && live.includes(hero)
			? [...live.slice(1), ...scheduled]
			: [...live, ...scheduled.slice(1)];
	return { hero, others };
}

function RoomRow({ s }: { s: BoardSession }) {
	const meta = statusMeta(s.status);
	return (
		<li className="flex items-center justify-between gap-3 px-4 py-3">
			<div className="min-w-0">
				<span className="block truncate text-sm font-medium">
					{sessionTitle(s)}
				</span>
				{s.scheduled_at && (
					<span className="text-xs text-muted-foreground">
						{whenLabel(s.scheduled_at)}
					</span>
				)}
			</div>
			<Button
				size="sm"
				variant={meta.live ? "default" : "outline"}
				nativeButton={false}
				render={
					<Link
						href={
							meta.live
								? `/materials/sessions/${s.id}/room`
								: `/materials/sessions/${s.id}`
						}
					/>
				}
			>
				{meta.live ? "Entrar" : "Ver"}
			</Button>
		</li>
	);
}

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
	const roster = useClubPresence(userId, rosterMembers);
	const [pending, startTransition] = useTransition();
	const { hero, others } = splitSessions(sessions);
	const canLlamar = sessions.some(
		(s) =>
			s.moderator_id === userId &&
			(s.status === "lobby" || s.status === "in_progress"),
	);

	const createTrigger = (
		<Button variant="outline" className="w-full sm:w-fit">
			+ Nueva sesión
		</Button>
	);

	const main = (
		<div className="flex flex-col gap-6">
			{hero ? (
				(() => {
					const meta = statusMeta(hero.status);
					return (
						<Card>
							<CardContent className="flex flex-col gap-3 p-6">
								<Badge variant={meta.live ? "default" : "secondary"}>
									{meta.label}
								</Badge>
								<h2 className="font-heading text-xl font-medium">
									{sessionTitle(hero)}
								</h2>
								<p className="text-sm text-muted-foreground">
									{whenLabel(hero.scheduled_at)} · Modera{" "}
									{hero.moderator_name ?? "—"}
								</p>
								<Button
									className="w-fit"
									nativeButton={false}
									render={
										<Link
											href={
												meta.live
													? `/materials/sessions/${hero.id}/room`
													: `/materials/sessions/${hero.id}`
											}
										/>
									}
								>
									{meta.live ? "Entrar" : "Ver detalle"}
								</Button>
							</CardContent>
						</Card>
					);
				})()
			) : (
				<Card>
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
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">También abiertas</CardTitle>
					</CardHeader>
					<CardContent className="p-0 pt-0">
						<ul className="divide-y divide-border">
							{others.map((s) => (
								<RoomRow key={s.id} s={s} />
							))}
						</ul>
					</CardContent>
				</Card>
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

	const membersPanel = (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">
					Miembros ({roster.filter((m) => m.online).length} en línea)
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-col divide-y divide-border">
					{roster.map((m) => (
						<li key={m.id} className="flex items-center justify-between py-2">
							<span className="flex min-w-0 items-center gap-2">
								<Avatar
									size="sm"
									className={m.online ? undefined : "opacity-40"}
								>
									<AvatarFallback>
										{(m.display_name || "?").slice(0, 1).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="truncate text-sm">{m.display_name}</span>
							</span>
							{canLlamar && m.online && m.id !== userId && (
								<Button
									size="xs"
									variant="ghost"
									disabled={pending}
									onClick={() => {
										const convokeId = sessions.find(
											(s) =>
												s.moderator_id === userId &&
												(s.status === "lobby" || s.status === "in_progress"),
										)?.id;
										if (!convokeId) return;
										startTransition(async () => {
											const r = await convocarAction(convokeId, m.id);
											if ("error" in r) toast.error(r.error);
											else toast.success("Convocatoria enviada");
										});
									}}
								>
									Llamar
								</Button>
							)}
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);

	return (
		<div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
			<div className="hidden gap-8 md:grid md:grid-cols-[1fr_280px]">
				{main}
				{membersPanel}
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
					<TabsContent value="miembros">{membersPanel}</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
