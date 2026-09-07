"use client";

import {
	ArrowRight01Icon,
	Clock01Icon,
	EyeIcon,
	MinusSignIcon,
	PencilEdit01Icon,
	Tick01Icon,
	TrashIcon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { CierreStage } from "@/app/materials/_components/cierre-stage";
import { DrawCeremonyView } from "@/app/materials/_components/draw-ceremony-view";
import { StageBar } from "@/app/materials/_components/stage-bar";
import { StagePanel } from "@/app/materials/_components/stage-panel";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import { useRoomRealtime } from "@/app/materials/_hooks/use-room-realtime";
import type { RatingProgress } from "@/app/materials/_lib/rating";
import {
	advanceRoomStage,
	confirmPresence,
	deleteQuestion,
	editQuestion,
	executeDraw,
	saveQuestion,
	toggleOptOut,
} from "@/app/materials/_lib/room-actions";
import type {
	RoomParticipant,
	RoomQuestion,
	RoomReadiness,
	RoomSnapshot,
	RoomStage,
} from "@/app/materials/_lib/room-types";
import {
	ROOM_STAGE_LABELS,
	ROOM_STAGE_ORDER,
} from "@/app/materials/_lib/room-types";
import { InfoButton } from "@/components/info-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ActionResult } from "@/lib/server-action";

type Props = {
	snapshot: RoomSnapshot;
	userId: string;
	isModerator: boolean;
	/** Progreso del rating — presente cuando la Sala está en Cierre. */
	rating: RatingProgress | null;
};

/**
 * Texto del tooltip del ModeratorNav por etapa. Cada entrada describe:
 *  - `description`: en qué consiste la etapa actual.
 *  - `nextCondition`: qué tiene que estar dado para avanzar.
 * La `key` es la etapa actual; la etapa siguiente sale del `ROOM_STAGE_ORDER`.
 */
const STAGE_HELP: Record<
	RoomStage,
	{ description: string; nextCondition: string }
> = {
	questions: {
		description:
			"Cada miembro escribe su pregunta en privado. Los demás solo ven que la enviaron.",
		nextCondition:
			"Todos los miembros deben tener al menos 1 pregunta enviada.",
	},
	presence: {
		description:
			"Los miembros confirman que están en la tertulia. Listo = presente + al menos 1 pregunta.",
		nextCondition:
			"Todos los miembros deben estar Listos para ejecutar el Sorteo.",
	},
	draw: {
		description:
			"Las parejas se asignan al azar; la pregunta se revela recién en el debate.",
		nextCondition:
			"Todos los miembros deben estar Listos (el guard lo verifica).",
	},
	debate: {
		description:
			"Las parejas exponen y complementan por turno. El moderador revela y avanza cada intervención.",
		nextCondition: "Todas las intervenciones deben estar completas.",
	},
	cierre: {
		description:
			"Fin de la tertulia. El moderador cierra la sesión cuando no queda nada pendiente.",
		nextCondition: "",
	},
};

export function RoomPanel({ snapshot, userId, isModerator, rating }: Props) {
	useRoomRealtime(snapshot.sessionId);

	return (
		<div className="flex flex-col gap-4">
			<StageBar current={snapshot.roomStage} />

			<StageContent
				snapshot={snapshot}
				userId={userId}
				isModerator={isModerator}
				rating={rating}
			/>

			{isModerator &&
				!(snapshot.roomStage === "debate" && snapshot.debate?.mode === "done") && (
					<ModeratorNav snapshot={snapshot} />
				)}
		</div>
	);
}

// ─── Stage Router ───────────────────────────────────────────

function StageContent({
	snapshot,
	userId,
	isModerator,
	rating,
}: {
	snapshot: RoomSnapshot;
	userId: string;
	isModerator: boolean;
	rating: RatingProgress | null;
}) {
	switch (snapshot.roomStage) {
		case "questions":
			return (
				<QuestionsStage
					sessionId={snapshot.sessionId}
					materialId={snapshot.materialId}
					questions={snapshot.questions}
					participants={snapshot.participants}
					userId={userId}
				/>
			);
		case "presence":
			return (
				<PresenceStage
					sessionId={snapshot.sessionId}
					participants={snapshot.participants}
					questions={snapshot.questions}
					readiness={snapshot.readiness}
					userId={userId}
				/>
			);
		case "draw":
			return (
				<DrawStage
					snapshot={snapshot}
					userId={userId}
					isModerator={isModerator}
				/>
			);
		case "debate": {
			if (!snapshot.debate) return null;
			const activeId =
				snapshot.debate.mode === "active" ? snapshot.debate.assignmentId : null;
			const authorId = activeId
				? (snapshot.assignments.find((a) => a.assignmentId === activeId)
						?.authorId ?? null)
				: null;
			return (
				<StagePanel
					debate={snapshot.debate}
					sessionId={snapshot.sessionId}
					userId={userId}
					isModerator={isModerator}
					authorId={authorId}
				/>
			);
		}
		case "cierre":
			if (!snapshot.cierre) return null;
			return (
				<CierreStage
					sessionId={snapshot.sessionId}
					rating={rating}
					cierre={snapshot.cierre}
					isModerator={isModerator}
				/>
			);
	}
}

// ─── Moderator Navigation ───────────────────────────────────

function ModeratorNav({ snapshot }: { snapshot: RoomSnapshot }) {
	const { pending, run } = useRoomMutation();
	const currentIdx = ROOM_STAGE_ORDER.indexOf(snapshot.roomStage);
	const nextStage = ROOM_STAGE_ORDER[currentIdx + 1] as RoomStage | undefined;

	if (!nextStage) return null;

	// Adelantar con faltantes pide confirmación explícita que los nombra:
	// hacia Debate, quiénes no están Listos; hacia Cierre, cuántas
	// Intervenciones quedan sin completar.
	const members = snapshot.participants.filter((p) => p.role === "member");
	const notReady = members.filter(
		(p) => !snapshot.questions.some((q) => q.authorId === p.memberId),
	);
	const remainingInterventions = snapshot.assignments.filter(
		(a) => a.state !== "complete",
	).length;
	const advanceWarning: string[] | null =
		nextStage === "debate" && notReady.length > 0
			? notReady.map((p) => p.displayName)
			: nextStage === "cierre" && remainingInterventions > 0
				? [`${remainingInterventions} intervención(es) sin completar`]
				: null;

	function handleAdvance() {
		run(() => advanceRoomStage(snapshot.sessionId, nextStage!));
	}

	const button = (
		<Button
			variant="default"
			disabled={pending}
			onClick={advanceWarning ? undefined : handleAdvance}
		>
			Continuar a {ROOM_STAGE_LABELS[nextStage!]}
			<HugeiconsIcon
				icon={ArrowRight01Icon}
				strokeWidth={2}
				data-icon="inline-end"
				aria-hidden="true"
			/>
		</Button>
	);

	const help = STAGE_HELP[snapshot.roomStage];

	if (!advanceWarning) {
		return (
			<div className="flex justify-end">
				<Tooltip>
					<TooltipTrigger render={button} />
					<TooltipContent
						side="top"
						align="end"
						sideOffset={8}
						className="max-w-sm"
					>
						<div className="flex flex-col gap-1.5 text-left">
							<p className="font-medium">
								Estás en {ROOM_STAGE_LABELS[snapshot.roomStage]}
							</p>
							<p className="text-background/80">{help.description}</p>
							{help.nextCondition && (
								<p className="mt-0.5 border-t border-background/20 pt-1.5 text-background/80">
									<span className="font-medium">
										Para ir a {ROOM_STAGE_LABELS[nextStage!]}:
									</span>{" "}
									{help.nextCondition}
								</p>
							)}
						</div>
					</TooltipContent>
				</Tooltip>
			</div>
		);
	}

	return (
		<div className="flex justify-end">
			<Dialog>
				<DialogTrigger render={button} />
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Ir a {ROOM_STAGE_LABELS[nextStage!]} de todos modos
						</DialogTitle>
						<DialogDescription>Pendientes:</DialogDescription>
					</DialogHeader>
					<ul className="flex flex-col gap-1 py-2">
						{advanceWarning.map((label) => (
							<li key={label} className="text-sm">
								{label}
							</li>
						))}
					</ul>
					<DialogFooter>
						<DialogClose render={<Button variant="outline" size="sm" />}>
							Cancelar
						</DialogClose>
						<DialogClose
							render={
								<Button size="sm" disabled={pending} onClick={handleAdvance} />
							}
						>
							Avanzar de todos modos
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ─── Questions Stage ────────────────────────────────────────

function QuestionsStage({
	sessionId,
	materialId,
	questions,
	participants,
	userId,
}: {
	sessionId: string;
	materialId: string | null;
	questions: RoomQuestion[];
	participants: RoomParticipant[];
	userId: string;
}) {
	const [pending, start] = useTransition();
	const [text, setText] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
		null,
	);
	const editRef = useRef<HTMLTextAreaElement | null>(null);

	const myQuestions = questions.filter((q) => q.isMine);
	const myCount = myQuestions.length;

	useEffect(() => {
		if (editingId && editRef.current) {
			editRef.current.focus();
			editRef.current.select();
		}
	}, [editingId]);

	function handleSubmit() {
		const trimmed = text.trim();
		if (!trimmed) return;
		start(async () => {
			const r = await saveQuestion(sessionId, materialId, trimmed);
			if (!r.ok) {
				toast.error(r.error);
			} else {
				setText("");
				toast.success(`Pregunta ${myCount + 1} enviada`);
			}
		});
	}

	function handleStartEdit(q: RoomQuestion) {
		setEditingId(q.id);
		setDraft(q.text ?? "");
	}

	function handleCancelEdit() {
		setEditingId(null);
		setDraft("");
	}

	function handleSaveEdit(q: RoomQuestion) {
		const trimmed = draft.trim();
		if (!trimmed || trimmed === q.text) {
			handleCancelEdit();
			return;
		}
		start(async () => {
			const r = await editQuestion(q.id, sessionId, trimmed);
			if (!r.ok) {
				toast.error(r.error);
			} else {
				handleCancelEdit();
				toast.success("Pregunta actualizada");
			}
		});
	}

	function handleConfirmDelete() {
		const id = confirmingDeleteId;
		if (!id) return;
		start(async () => {
			const r = await deleteQuestion(id, sessionId);
			if (!r.ok) {
				toast.error(r.error);
			} else {
				toast.success("Pregunta borrada");
			}
			setConfirmingDeleteId(null);
		});
	}

	function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Escape") {
			e.preventDefault();
			handleCancelEdit();
		} else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			// Resolve la pregunta actual del closure del map.
			const q = myQuestions.find((item) => item.id === editingId);
			if (q) handleSaveEdit(q);
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<div className="flex items-center gap-1.5">
						<CardTitle>Escribe tu pregunta</CardTitle>
						<InfoButton
							title="¿Quién ve tu pregunta?"
							description="Tu texto es privado. Los demás solo ven que enviaste una."
						/>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<Textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						rows={3}
						placeholder="¿Qué pregunta quieres hacer sobre el material?"
						disabled={pending}
					/>
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							{myCount > 0
								? `${myCount} pregunta${myCount > 1 ? "s" : ""} enviada${myCount > 1 ? "s" : ""}`
								: "Ninguna enviada aún"}
						</span>
						<Button disabled={pending || !text.trim()} onClick={handleSubmit}>
							Enviar pregunta
						</Button>
					</div>
				</CardContent>
			</Card>

			{myQuestions.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Tus preguntas</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="flex flex-col gap-2">
							{myQuestions.map((q, idx) => {
								const isEditing = editingId === q.id;
								return (
									<li
										key={q.id}
										className="rounded-md border border-border border-l-4 border-l-primary/60 bg-card/40 p-4 text-sm"
									>
										{isEditing ? (
											<div className="flex flex-col gap-2">
												<Textarea
													ref={editRef}
													value={draft}
													onChange={(e) => setDraft(e.target.value)}
													onKeyDown={handleEditKeyDown}
													rows={3}
													disabled={pending}
												/>
												<div className="flex justify-end gap-2">
													<Button
														variant="ghost"
														size="xs"
														disabled={pending}
														onClick={handleCancelEdit}
													>
														Cancelar
													</Button>
													<Button
														size="xs"
														disabled={pending || !draft.trim()}
														onClick={() => handleSaveEdit(q)}
													>
														Guardar
													</Button>
												</div>
											</div>
										) : (
											<div className="flex items-start justify-between gap-2">
												<span className="flex-1 whitespace-pre-wrap">
													{q.text}
												</span>
												<div className="flex shrink-0 gap-1">
													<Button
														variant="ghost"
														size="icon-xs"
														disabled={pending}
														aria-label="Editar pregunta"
														onClick={() => handleStartEdit(q)}
													>
														<HugeiconsIcon
															icon={PencilEdit01Icon}
															strokeWidth={2}
															aria-hidden="true"
														/>
													</Button>
													<Button
														variant="ghost"
														size="icon-xs"
														disabled={pending}
														aria-label="Borrar pregunta"
														className="text-destructive hover:bg-destructive/10 hover:text-destructive"
														onClick={() => setConfirmingDeleteId(q.id)}
													>
														<HugeiconsIcon
															icon={TrashIcon}
															strokeWidth={2}
															aria-hidden="true"
														/>
													</Button>
												</div>
											</div>
										)}
									</li>
								);
							})}
						</ul>
					</CardContent>
				</Card>
			)}

			<Dialog
				open={confirmingDeleteId !== null}
				onOpenChange={(open) => {
					if (!open) setConfirmingDeleteId(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>¿Borrar la pregunta?</DialogTitle>
						<DialogDescription>
							No se puede deshacer. Si la Sala ya pasó a la etapa de Presentes,
							el borrado se rechaza.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose
							render={<Button variant="outline" size="sm" disabled={pending} />}
						>
							Cancelar
						</DialogClose>
						<Button
							variant="destructive"
							size="sm"
							disabled={pending}
							onClick={handleConfirmDelete}
						>
							Borrar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Participantes</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="flex flex-col gap-2">
						{participants.map((p) => {
							const hasQuestion = questions.some(
								(q) => q.authorId === p.memberId,
							);
							return (
								<li
									key={p.memberId}
									className="flex items-center justify-between text-sm"
								>
									<span>
										{p.displayName}
										{p.role === "spectator" && (
											<Badge variant="outline" className="ml-2">
												Espectador
											</Badge>
										)}
									</span>
									{p.role === "member" && (
										<Badge variant={hasQuestion ? "secondary" : "outline"}>
											{hasQuestion ? "✓ enviado" : "pendiente"}
										</Badge>
									)}
								</li>
							);
						})}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}

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
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<span
						tabIndex={0}
						className={
							ok
								? "inline-flex text-primary"
								: "inline-flex text-muted-foreground/50"
						}
					/>
				}
			>
				<HugeiconsIcon
					icon={ok ? Tick01Icon : MinusSignIcon}
					strokeWidth={2}
					className="size-4"
					aria-hidden="true"
				/>
			</TooltipTrigger>
			<TooltipContent>{ok ? okLabel : pendingLabel}</TooltipContent>
		</Tooltip>
	);
}

function SessionMarker() {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<span
						tabIndex={0}
						className="inline-flex text-primary"
						aria-label="Sesión activa"
					/>
				}
			>
				<HugeiconsIcon
					icon={UserIcon}
					strokeWidth={2}
					className="size-3.5"
					aria-hidden="true"
				/>
			</TooltipTrigger>
			<TooltipContent>Sesión activa</TooltipContent>
		</Tooltip>
	);
}

type WaitingKind =
	| "spectator"
	| "self-pending"
	| "waiting-others"
	| "all-ready";

function WaitingBanner({
	kind,
	missingCount,
	ready,
	total,
}: {
	kind: WaitingKind;
	missingCount: number;
	ready: number;
	total: number;
}) {
	if (kind === "self-pending") return null;

	const config: Record<
		Exclude<WaitingKind, "self-pending">,
		{
			icon: typeof Clock01Icon;
			title: string;
			description: string;
			tone: "primary" | "muted";
		}
	> = {
		spectator: {
			icon: EyeIcon,
			title: "Estás mirando como espectador",
			description:
				"Los miembros confirman asistencia. El sorteo empieza cuando todos estén listos.",
			tone: "muted",
		},
		"waiting-others": {
			icon: Clock01Icon,
			title: "Esperando que todos confirmen",
			description: `Falta${missingCount === 1 ? "" : "n"} ${missingCount} para que los ${total} miembros estén listos (${ready}/${total} ahora).`,
			tone: "muted",
		},
		"all-ready": {
			icon: Clock01Icon,
			title: "Esperando al moderador",
			description:
				"Todos listos. El moderador ejecuta el sorteo a continuación.",
			tone: "primary",
		},
	};

	const c = config[kind];

	return (
		<div
			className={
				c.tone === "primary"
					? "flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4"
					: "flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4"
			}
			role="status"
			aria-live="polite"
		>
			<HugeiconsIcon
				icon={c.icon}
				strokeWidth={1.75}
				className={
					c.tone === "primary"
						? "mt-0.5 size-5 shrink-0 text-primary"
						: "mt-0.5 size-5 shrink-0 text-muted-foreground"
				}
				aria-hidden="true"
			/>
			<div className="flex flex-col gap-0.5">
				<p className="font-medium">{c.title}</p>
				<p className="text-sm text-muted-foreground">{c.description}</p>
			</div>
		</div>
	);
}

function PresenceStage({
	sessionId,
	participants,
	questions,
	readiness,
	userId,
}: {
	sessionId: string;
	participants: RoomParticipant[];
	questions: RoomQuestion[];
	readiness: RoomReadiness;
	userId: string;
}) {
	const { pending, run } = useRoomMutation();
	const me = participants.find((p) => p.memberId === userId);
	const members = participants.filter((p) => p.role === "member");
	const spectators = participants.filter((p) => p.role === "spectator");

	const waitingKind: WaitingKind = !me
		? "self-pending"
		: me.role === "spectator"
			? "spectator"
			: readiness.allReady
				? "all-ready"
				: "waiting-others";

	const missingCount = readiness.total - readiness.ready;

	function handleConfirm() {
		run(() => confirmPresence(sessionId));
	}

	function handleSorteo(inDraw: boolean) {
		if (!me) return;
		const shouldOptOut = !inDraw;
		if (shouldOptOut === me.optOut) return;
		run(() => toggleOptOut(sessionId, me.optOut));
	}

	return (
		<TooltipProvider>
			<div className="flex flex-col gap-6">
				<header className="flex items-end justify-between gap-4">
					<div className="flex items-center gap-1.5">
						<h2 className="font-heading text-xl font-semibold">Presentes</h2>
						<InfoButton
							title="Listo"
							description="Listo: asistencia confirmada y al menos una pregunta enviada. El sorteo espera a que todos los miembros estén listos."
						/>
					</div>
					<p className="text-sm tabular-nums text-muted-foreground">
						{readiness.ready}/{readiness.total} listos
					</p>
				</header>

				<WaitingBanner
					kind={waitingKind}
					missingCount={missingCount}
					ready={readiness.ready}
					total={readiness.total}
				/>

				{!me && (
					<Button disabled={pending} onClick={handleConfirm}>
						Confirmar asistencia
					</Button>
				)}

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border text-left">
								<th className="py-2 pr-4 font-medium">Nombre</th>
								<th className="py-2 pr-4 font-medium">Listo</th>
								<th className="py-2 font-medium">
									<span className="inline-flex items-center gap-1">
										Sorteo
										<InfoButton
											title="Sorteo"
											description="El sorteo asigna una pregunta a cada miembro. Quien quede fuera sigue en la tertulia, sin pregunta asignada."
										/>
									</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{members.map((p, i) => {
								const isYou = p.memberId === userId;
								const hasQuestion = questions.some(
									(q) => q.authorId === p.memberId,
								);
								return (
									<tr
										key={p.memberId}
										className={
											isYou
												? "bg-primary/5"
												: i % 2 === 1
													? "bg-foreground/[0.03]"
													: undefined
										}
									>
										<td className="py-3 pr-4">
											<span className="inline-flex items-center gap-1.5">
												{p.displayName}
												{isYou && <SessionMarker />}
											</span>
										</td>
										<td className="py-3 pr-4">
											<StatusIcon
												ok={hasQuestion}
												okLabel="Pregunta enviada"
												pendingLabel="Sin pregunta"
											/>
										</td>
										<td className="py-3">
											{isYou && me?.role === "member" ? (
												<label className="inline-flex items-center gap-2">
													<Switch
														size="sm"
														checked={!me.optOut}
														disabled={pending}
														onCheckedChange={handleSorteo}
													/>
												</label>
											) : (
												<StatusIcon
													ok={!p.optOut}
													okLabel="Entra al sorteo"
													pendingLabel="Fuera del sorteo"
												/>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{spectators.length > 0 && (
					<p className="text-xs text-muted-foreground">
						Espectadores · {spectators.map((s) => s.displayName).join(" · ")}
					</p>
				)}
			</div>
		</TooltipProvider>
	);
}

// ─── Draw Stage ─────────────────────────────────────────────

function DrawStage({
	snapshot,
	userId,
	isModerator,
}: {
	snapshot: RoomSnapshot;
	userId: string;
	isModerator: boolean;
}) {
	const { pending, run } = useRoomMutation();

	return (
		<DrawCeremonyView
			done={snapshot.draw.done}
			createdAt={snapshot.draw.createdAt}
			assignments={snapshot.assignments}
			readiness={snapshot.readiness}
			userId={userId}
			isModerator={isModerator}
			pending={pending}
			onExecute={() => run(() => executeDraw(snapshot.sessionId))}
		/>
	);
}
