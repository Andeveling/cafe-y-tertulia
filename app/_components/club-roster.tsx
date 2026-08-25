"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { convocarAction } from "@/app/materials/_lib/convocatoria-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type RosterMember, useClubPresence } from "@/hooks/use-club-presence";
import type { BoardSession } from "./board-helpers";

export function ClubRoster({
	sessions,
	rosterMembers,
	userId,
}: {
	sessions: BoardSession[];
	rosterMembers: RosterMember[];
	userId?: string;
}) {
	const roster = useClubPresence(userId, rosterMembers);
	const [pending, startTransition] = useTransition();
	const canLlamar = sessions.some(
		(s) =>
			s.moderator_id === userId &&
			(s.status === "lobby" || s.status === "in_progress"),
	);

	return (
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
}
