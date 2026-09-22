"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { convocarAction } from "@/app/materials/_lib/convocatoria-actions";
import {
	buildInviteCandidates,
	type InviteRosterMember,
} from "@/app/materials/_lib/presence-invite";
import { MemberAvatar, memberFirstName } from "@/components/member-avatar";
import { PresenceEstado } from "@/components/presence-estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

	const avatares = useMemo(
		() => Object.fromEntries(presenceRoster.map((m) => [m.id, m.avatar])),
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
	const hasPending = candidates.some((c) => c.pending);

	// Sin nadie a quien llamar no hay sección: el toast ya confirmó
	// los enviados y la mesa muestra quién está.
	if (llamables === 0 && !hasPending) return null;

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
		<section aria-label="Invitar a la sala" className="flex flex-col gap-2">
			<h2 className="font-heading text-base font-semibold text-muted-foreground">
				Invitar · {llamables} {llamables === 1 ? "disponible" : "disponibles"}
			</h2>
			<ul className="flex flex-col gap-2">
				{candidates.map((c) => (
					<li
						key={c.id}
						title={c.displayName}
						className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
					>
						<span className="flex min-w-0 flex-1 items-center gap-2">
							<MemberAvatar
								name={c.displayName || "Miembro"}
								avatar={avatares[c.id] ?? null}
								size="sm"
								badge={c.online}
								className={
									c.estado === "desconectado" ? "opacity-40" : undefined
								}
							/>
							<span className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="truncate text-sm font-medium">
									{memberFirstName(c.displayName || "Miembro")}
								</span>
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
							<span className="shrink-0 text-xs text-muted-foreground">
								{c.enOtraSala ? "En otra sala" : "offline"}
							</span>
						)}
					</li>
				))}
			</ul>
		</section>
	);
}
