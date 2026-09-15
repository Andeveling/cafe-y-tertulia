"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTransition } from "react";
import { toast } from "sonner";
import { convocarAction } from "@/app/materials/_lib/convocatoria-actions";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { type RosterMember, useClubPresence } from "@/hooks/use-club-presence";
import type { BoardSession } from "./board-helpers";

export function ClubRoster({
	sessions,
	rosterMembers,
	userId,
	collapsible = false,
}: {
	sessions: BoardSession[];
	rosterMembers: RosterMember[];
	userId?: string;
	collapsible?: boolean;
}) {
	const roster = useClubPresence(userId, rosterMembers);
	const [pending, startTransition] = useTransition();
	const online = roster.filter((m) => m.online).length;
	const canLlamar = sessions.some(
		(s) =>
			s.moderator_id === userId &&
			(s.status === "lobby" || s.status === "in_progress"),
	);

	const title = `Miembros · ${online} en línea`;

	const list = (
		<ul className="flex flex-col">
			{roster.map((m, i) => (
				<li key={m.id}>
					{i > 0 && <Separator />}
					<div className="flex items-center justify-between gap-2 py-2">
						<span className="flex min-w-0 items-center gap-2">
							<Avatar
								size="sm"
								className={m.online ? "ring-1 ring-primary/30" : "opacity-40"}
							>
								<AvatarFallback>
									{(m.display_name || "?").slice(0, 1).toUpperCase()}
								</AvatarFallback>
								{m.online && <AvatarBadge />}
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
					</div>
				</li>
			))}
		</ul>
	);

	if (!collapsible) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent>{list}</CardContent>
			</Card>
		);
	}

	return (
		<Collapsible>
			<Card>
				<CardHeader>
					<CollapsibleTrigger
						render={
							<Button
								variant="ghost"
								className="h-auto w-full justify-between px-0 py-0 hover:bg-transparent"
							/>
						}
					>
						<CardTitle className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
							{title}
						</CardTitle>
						<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-end" />
					</CollapsibleTrigger>
				</CardHeader>
				<CollapsibleContent>
					<CardContent>{list}</CardContent>
				</CollapsibleContent>
			</Card>
		</Collapsible>
	);
}
