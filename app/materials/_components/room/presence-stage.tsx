"use client";

import {
	Clock01Icon,
	MinusSignIcon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { LeaveSessionButton } from "@/app/materials/_components/leave-session-button";
import { PresenceInvite } from "@/app/materials/_components/presence-invite";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import {
	confirmPresence,
	setSpectator,
	toggleOptOut,
	transferModerator,
} from "@/app/materials/_lib/room-actions";
import { InfoButton } from "@/components/info-button";
import { MemberAvatar, memberFirstName } from "@/components/member-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import type { EtapaProps } from "./stage-props";

// ─── Presence Stage ─────────────────────────────────────────

function StatusIcon({
	ok,
	okLabel,
	pendingLabel,
}: {
	ok: boolean;
	okLabel: string;
	pendingLabel: string;
}) {
	const label = ok ? okLabel : pendingLabel;
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<span
						tabIndex={0}
						role="img"
						aria-label={label}
						className={
							ok
								? "inline-flex text-primary"
								: "inline-flex text-muted-foreground/50"
						}
					>
						<HugeiconsIcon
							icon={ok ? Tick01Icon : MinusSignIcon}
							strokeWidth={2}
							className="size-4"
							aria-hidden="true"
						/>
					</span>
				}
			/>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}

/**
 * Confirmación antes de sacar a alguien del sorteo: evita misclicks
 * en una decisión que cambia la mesa. Mismo patrón Dialog que el
 * "Volver" del Debate.
 */
function SpectatorConfirm({
	name,
	pending,
	onConfirm,
}: {
	name: string;
	pending: boolean;
	onConfirm: () => void;
}) {
	return (
		<Dialog>
			<Tooltip>
				<TooltipTrigger
					render={
						<DialogTrigger
							render={<Button variant="ghost" size="xs" disabled={pending} />}
						>
							A espectador
						</DialogTrigger>
					}
				/>
				<TooltipContent>
					Sigue en la tertulia mirando, sin pregunta asignada.
				</TooltipContent>
			</Tooltip>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>¿Pasar a {name} a espectador?</DialogTitle>
					<DialogDescription>
						Queda fuera del sorteo pero sigue en la tertulia. Puedes devolverlo
						a la mesa cuando quieras.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose
						render={<Button variant="outline" size="sm" disabled={pending} />}
					>
						Cancelar
					</DialogClose>
					<DialogClose
						render={<Button size="sm" disabled={pending} onClick={onConfirm} />}
					>
						Pasar a espectador
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function PresenceStage({
	snapshot,
	view,
	userId,
	isModerator,
	rosterMembers = [],
	pendingIds = [],
}: EtapaProps & { isModerator: boolean }) {
	const { sessionId, participants, readiness, moderatorId } = snapshot;
	const { pending, run } = useRoomMutation();
	const me = participants.find((p) => p.memberId === userId);
	const members = view.members;
	const spectators = view.spectators;
	const moderatorName = view.moderatorName;
	const drawDone = snapshot.draw.done;
	const prevPresence = useRef<{
		ids: Set<string>;
		readyIds: Set<string>;
		names: Map<string, string>;
	} | null>(null);

	useEffect(() => {
		const ids = new Set(members.map((p) => p.memberId));
		const readyIds = new Set(view.questionAuthorIds);
		const names = new Map(members.map((m) => [m.memberId, m.displayName]));
		const prev = prevPresence.current;
		if (prev) {
			for (const m of members) {
				if (m.memberId === userId) continue;
				if (!prev.ids.has(m.memberId)) {
					toast.success(`${m.displayName} se unió`);
				}
			}
			for (const id of prev.ids) {
				if (id === userId) continue;
				if (!ids.has(id)) {
					toast(`${prev.names.get(id) ?? "Alguien"} salió de la sala`);
				}
			}
			for (const id of readyIds) {
				if (id === userId) continue;
				if (!prev.readyIds.has(id)) {
					const name = members.find((m) => m.memberId === id)?.displayName;
					if (name && prev.ids.has(id)) {
						toast.success(`${name} está listo`);
					}
				}
			}
		}
		prevPresence.current = { ids, readyIds, names };
	}, [members, userId, view.questionAuthorIds]);

	function handleConfirm() {
		run(() => confirmPresence(sessionId));
	}

	function handleSorteo(inDraw: boolean) {
		if (!me) return;
		const shouldOptOut = !inDraw;
		if (shouldOptOut === me.optOut) return;
		run(() => toggleOptOut(sessionId, me.optOut));
	}

	function handleSpectator(memberId: string, makeSpectator: boolean) {
		run(
			() => setSpectator(sessionId, memberId, makeSpectator),
			() => {
				toast.success(
					makeSpectator ? "Pasado a espectador" : "Espectador retirado",
				);
			},
		);
	}

	function handleTransfer(newModeratorId: string) {
		run(
			() => transferModerator(sessionId, newModeratorId),
			() => {
				toast.success("Moderación cedida");
			},
		);
	}

	return (
		<TooltipProvider>
			<div className="flex flex-col gap-6">
				<header className="flex items-end justify-between gap-4">
					<div className="flex items-center gap-1.5">
						<h2 className="font-heading text-xl font-semibold">Presentes</h2>
						<InfoButton
							title="Listo"
							description="Listo: presente con al menos una pregunta enviada. El sorteo espera a que todos los miembros estén listos."
						/>
					</div>
					<p className="text-sm tabular-nums text-muted-foreground">
						{readiness.ready}/{readiness.total} listos
					</p>
				</header>

				{moderatorName && (
					<p className="text-sm break-words text-muted-foreground">
						Modera {moderatorName}
					</p>
				)}

				{!me && (
					<Button disabled={pending} onClick={handleConfirm}>
						Confirmar asistencia
					</Button>
				)}

				{isModerator && (
					<PresenceInvite
						sessionId={sessionId}
						userId={userId}
						rosterMembers={rosterMembers}
						participantIds={participants.map((p) => p.memberId)}
						pendingIds={pendingIds}
					/>
				)}

				<ul aria-label="Miembros en la mesa" className="flex flex-col gap-2">
					{members.length === 0 && (
						<li className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
							Aún no hay miembros en la mesa.
						</li>
					)}
					{members.map((p) => {
						const isYou = p.memberId === userId;
						const hasQuestion = view.questionAuthorIds.has(p.memberId);
						// Fuera del sorteo (optOut): especta, no le falta nada.
						const optedOut = p.optOut;
						const showMesa = isModerator && !isYou && !drawDone;
						const canSpectate = showMesa && !optedOut;
						const canTransfer = showMesa && p.memberId !== moderatorId;
						return (
							<li
								key={p.memberId}
								title={p.displayName}
								className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
							>
								<MemberAvatar
									name={p.displayName}
									avatar={p.avatar}
									size="sm"
								/>
								<span className="flex min-w-0 flex-1 flex-col gap-1">
									<span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
										<span className="truncate">
											{memberFirstName(p.displayName)}
										</span>
										{isYou && <Badge variant="default">Tú</Badge>}
										{p.memberId === moderatorId && (
											<Badge variant="secondary">Modera</Badge>
										)}
										{optedOut && <Badge variant="outline">Mira</Badge>}
									</span>
									{optedOut ? (
										<span className="inline-flex items-center gap-1.5">
											<HugeiconsIcon
												icon={Clock01Icon}
												strokeWidth={2}
												aria-hidden="true"
												className="size-4 opacity-50"
											/>
											<span className="text-xs text-muted-foreground">
												espectando
											</span>
										</span>
									) : (
										<span className="inline-flex items-center gap-1.5">
											<StatusIcon
												ok={hasQuestion}
												okLabel="Pregunta enviada"
												pendingLabel="Sin pregunta"
											/>
											<span className="text-xs text-muted-foreground">
												{hasQuestion ? "enviada" : "sin pregunta"}
											</span>
										</span>
									)}
								</span>
								{isYou && me?.role === "member" ? (
									<span className="flex shrink-0 items-center gap-1">
										<label className="inline-flex items-center gap-2">
											<Switch
												size="sm"
												checked={!me.optOut}
												disabled={pending}
												onCheckedChange={handleSorteo}
												aria-label="Entrar al sorteo"
											/>
											<span className="text-xs text-muted-foreground">
												{me.optOut ? "Sin sorteo" : "En sorteo"}
											</span>
										</label>
										<LeaveSessionButton sessionId={sessionId} />
									</span>
								) : (
									(canSpectate || canTransfer) && (
										<span className="flex shrink-0 items-center gap-1">
											{canSpectate && (
												<SpectatorConfirm
													name={memberFirstName(p.displayName)}
													pending={pending}
													onConfirm={() => handleSpectator(p.memberId, true)}
												/>
											)}
											{canTransfer && (
												<Button
													variant="ghost"
													size="xs"
													disabled={pending}
													onClick={() => handleTransfer(p.memberId)}
												>
													Ceder moderación
												</Button>
											)}
										</span>
									)
								)}
							</li>
						);
					})}
				</ul>

				{spectators.length > 0 && (
					<div className="flex flex-col gap-2">
						<p className="text-xs break-words text-muted-foreground">
							Espectadores · {spectators.map((s) => s.displayName).join(" · ")}
						</p>
						{isModerator && (
							<ul className="flex flex-col gap-1">
								{spectators.map((s) => (
									<li
										key={s.memberId}
										className="flex items-center justify-between text-sm"
									>
										<span className="min-w-0 flex-1 break-words">
											{s.displayName}
										</span>
										<Button
											variant="ghost"
											size="xs"
											disabled={pending}
											onClick={() => handleSpectator(s.memberId, false)}
										>
											Retirar
										</Button>
									</li>
								))}
							</ul>
						)}
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}
