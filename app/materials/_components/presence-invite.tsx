"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { convocarAction } from "@/app/materials/_lib/convocatoria-actions";
import {
	buildInviteCandidates,
	type InviteRosterMember,
} from "@/app/materials/_lib/presence-invite";
import { PresenceEstado } from "@/components/presence-estado";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClubPresence } from "@/hooks/use-club-presence";

type Props = {
	sessionId: string;
	userId: string;
	rosterMembers: InviteRosterMember[];
	participantIds: string[];
	pendingIds: string[];
};

export function PresenceInvite({
	sessionId,
	userId,
	rosterMembers,
	participantIds,
	pendingIds,
}: Props) {
	const presenceRoster = useClubPresence(userId, rosterMembers, {
		salaId: sessionId,
	});
	const [calling, startCalling] = useTransition();
	const [callingId, setCallingId] = useState<string | null>(null);
	const [sentIds, setSentIds] = useState<Set<string>>(new Set());

	const estados = useMemo(
		() => Object.fromEntries(presenceRoster.map((m) => [m.id, m.estado])),
		[presenceRoster],
	);

	const mergedPending = useMemo(() => {
		const s = new Set<string>(pendingIds);
		for (const id of sentIds) s.add(id);
		return s;
	}, [pendingIds, sentIds]);

	const candidates = useMemo(
		() =>
			buildInviteCandidates({
				roster: rosterMembers,
				onlineIds: presenceRoster.filter((m) => m.online).map((m) => m.id),
				participantIds: new Set(participantIds),
				pendingIds: mergedPending,
				selfId: userId,
				estados,
			}),
		[
			rosterMembers,
			presenceRoster,
			participantIds,
			mergedPending,
			userId,
			estados,
		],
	);

	const llamables = candidates.filter((c) => c.llamable).length;

	function handleCall(toId: string) {
		setCallingId(toId);
		startCalling(async () => {
			try {
				const r = await convocarAction(sessionId, toId);
				if ("error" in r) toast.error(r.error);
				else {
					setSentIds((prev) => new Set(prev).add(toId));
					toast.success("Convocatoria enviada");
				}
			} finally {
				setCallingId(null);
			}
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
					Invitar — {llamables} disponibles
				</CardTitle>
			</CardHeader>
			<CardContent>
				{candidates.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No hay miembros para invitar.
					</p>
				) : (
					<ul className="flex max-h-64 flex-col divide-y divide-border overflow-y-auto">
						{candidates.map((c) => (
							<li key={c.id} className="flex items-center justify-between py-2">
								<span className="flex min-w-0 items-center gap-2">
									<Avatar
										size="sm"
										className={
											c.estado === "desconectado"
												? "opacity-40"
												: "ring-1 ring-primary/30"
										}
									>
										<AvatarFallback>
											{(c.displayName || "?").slice(0, 1).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span className="flex min-w-0 flex-col">
										<span className="truncate text-sm">{c.displayName}</span>
										<PresenceEstado
											estado={c.estado}
											detalle={c.enOtraSala ? "En otra sala" : undefined}
										/>
									</span>
								</span>
								{c.pending ? (
									<Badge variant="outline">Convocado</Badge>
								) : c.llamable ? (
									<Button
										size="xs"
										variant="ghost"
										disabled={calling && callingId === c.id}
										onClick={() => handleCall(c.id)}
									>
										Llamar
									</Button>
								) : (
									<span className="text-xs text-muted-foreground">
										{c.enOtraSala ? "En otra sala" : "offline"}
									</span>
								)}
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
