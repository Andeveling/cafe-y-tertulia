"use client";

import {
	Clock01Icon,
	MessageQuestionIcon,
	PencilEdit01Icon,
	Tick01Icon,
	TrashIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LeaveSessionButton } from "@/app/materials/_components/leave-session-button";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import { questionsAdvance } from "@/app/materials/_lib/questions-advance";
import {
	advanceRoomStage,
	deleteQuestion,
	editQuestion,
	ensureRoomSeat,
	saveQuestion,
	setSpectator,
	toggleOptOut,
} from "@/app/materials/_lib/room-actions";
import {
	leftRoomRecently,
	readLeftRoomMarker,
} from "@/app/materials/_lib/room-seat-gate";
import type { RoomQuestion } from "@/app/materials/_lib/room-types";
import { InfoButton } from "@/components/info-button";
import { MemberAvatar, memberFirstName } from "@/components/member-avatar";
import { PresenceEstado } from "@/components/presence-estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import type { EtapaProps } from "./stage-props";

// ─── Questions Stage ────────────────────────────────────────

export function QuestionsStage({
	snapshot,
	view,
	userId,
	isModerator,
	advanceFor,
	onAdvanceForChange,
}: EtapaProps & {
	/**
	 * Pase de lista del Moderador, vive en el padre para que el nav pueda
	 * avanzar con las mismas decisiones sin un efecto que empuje estado
	 * hacia arriba.
	 */
	advanceFor?: Record<string, "wait" | "spectator">;
	onAdvanceForChange?: (next: Record<string, "wait" | "spectator">) => void;
}) {
	const { sessionId, materialId, questions, participants, moderatorId } =
		snapshot;
	const { pending, run } = useRoomMutation();
	const [text, setText] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");
	const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
		null,
	);
	const editRef = useRef<HTMLTextAreaElement | null>(null);
	const prevSeats = useRef<Map<string, string> | null>(null);

	const myQuestions = questions.filter((q) => q.isMine);
	const myCount = myQuestions.length;
	const me = participants.find((p) => p.memberId === userId) ?? null;
	const gate = questionsAdvance({
		participants,
		questionAuthorIds: view.questionAuthorIds,
	});
	const missingIds = new Set(gate.missingIds);
	/** Faltan: en sala, no espectadores, sin pregunta. */
	const missing = participants.filter((p) => missingIds.has(p.memberId));
	/** Ir de espectador exige mesa mínima: 3+ en sala y 2+ con pregunta. */
	const canSpectate = participants.length >= 3 && gate.readyCount >= 2;

	useEffect(() => {
		if (snapshot.status !== "lobby" || me) return;
		if (leftRoomRecently(readLeftRoomMarker(), sessionId)) return;
		void ensureRoomSeat(sessionId);
	}, [me, sessionId, snapshot.status]);

	useEffect(() => {
		const seats = new Map(participants.map((p) => [p.memberId, p.displayName]));
		const prev = prevSeats.current;
		if (prev) {
			for (const [id, name] of prev) {
				if (id === userId) continue;
				if (!seats.has(id)) toast(`${name} salió de la sala`);
			}
		}
		prevSeats.current = seats;
	}, [participants, userId]);

	useEffect(() => {
		if (editingId && editRef.current) {
			editRef.current.focus();
			editRef.current.select();
		}
	}, [editingId]);

	function handleSubmit() {
		const trimmed = text.trim();
		if (!trimmed || pending) return;
		run(
			() => saveQuestion(sessionId, materialId, trimmed),
			() => {
				setText("");
				toast.success(`Pregunta ${myCount + 1} enviada`);
			},
		);
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
		run(
			() => editQuestion(q.id, sessionId, trimmed),
			() => {
				handleCancelEdit();
				toast.success("Pregunta actualizada");
			},
		);
	}

	function handleConfirmDelete() {
		const id = confirmingDeleteId;
		if (!id) return;
		run(
			() => deleteQuestion(id, sessionId),
			() => {
				toast.success("Pregunta borrada");
				setConfirmingDeleteId(null);
			},
		);
	}

	/**
	 * Declarar Sin sorteo desde Preguntas. `me` puede ser null (quien mira
	 * la Sala sin fila aún, p. ej. el Moderador): el toggle sienta primero.
	 */
	function handleOptOut(next: boolean) {
		run(
			() => toggleOptOut(sessionId, me?.optOut ?? false),
			() => {
				toast.success(next ? "Vas como espectador" : "Vuelves al sorteo");
			},
		);
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
		<div className="flex flex-col gap-8">
			<Card className="shadow-sm ring-primary/20">
				<CardHeader>
					<div className="flex items-center gap-1.5">
						<CardTitle className="font-heading text-lg">Tu pregunta</CardTitle>
						<InfoButton
							title="¿Quién ve tu pregunta?"
							description="Tu texto es privado. Los demás solo ven que enviaste una. Solo vos podés corregirla, y solo durante Preguntas."
						/>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<Textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						rows={5}
						className="min-h-36"
						placeholder="¿Qué pregunta quieres hacer sobre el material?"
						disabled={pending}
					/>
					<div className="flex flex-nowrap items-center justify-end gap-2">
						<span className="mr-auto hidden min-w-0 truncate text-xs whitespace-nowrap text-muted-foreground tabular-nums sm:inline">
							{myCount > 0
								? `${myCount} pregunta${myCount > 1 ? "s" : ""} enviada${myCount > 1 ? "s" : ""}`
								: "Ninguna enviada aún"}
						</span>
						{!me?.optOut && (
							<Button
								variant="link"
								size="sm"
								disabled={pending || !canSpectate}
								title={
									canSpectate
										? undefined
										: "Disponible con 3+ en sala y 2+ con pregunta"
								}
								onClick={() => handleOptOut(true)}
							>
								Soy espectador
							</Button>
						)}
						{me?.optOut && (
							<Button
								variant="link"
								size="sm"
								className="min-w-0 shrink"
								disabled={pending}
								onClick={() => handleOptOut(false)}
							>
								<span className="truncate">Volver a participar del sorteo</span>
							</Button>
						)}
						<Button disabled={pending || !text.trim()} onClick={handleSubmit}>
							Enviar pregunta
						</Button>
					</div>
				</CardContent>
			</Card>

			<section
				aria-labelledby="tus-preguntas-title"
				className="flex flex-col gap-3"
			>
				<div className="flex items-baseline justify-between gap-2">
					<h2
						id="tus-preguntas-title"
						className="font-heading text-base font-semibold text-muted-foreground"
					>
						Tus preguntas
					</h2>
					<span className="text-xs text-muted-foreground tabular-nums">
						{myCount > 0 ? `${myCount} en privado` : "vacío"}
					</span>
				</div>
				{myQuestions.length === 0 ? (
					<div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
						<HugeiconsIcon
							icon={MessageQuestionIcon}
							strokeWidth={1.5}
							className="size-6 text-muted-foreground/70"
							aria-hidden="true"
						/>
						<p className="text-sm text-muted-foreground">
							Aún no envías preguntas. Aparecerán aquí para que puedas
							editarlas.
						</p>
					</div>
				) : (
					<ul className="flex flex-col gap-2">
						{myQuestions.map((q) => {
							const isEditing = editingId === q.id;
							return (
								<li
									key={q.id}
									className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm"
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
											<span
												aria-hidden="true"
												className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
											/>
											<span className="min-w-0 flex-1 break-words whitespace-pre-wrap">
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
				)}
			</section>

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

			<section
				aria-label="Participantes en la sala"
				className="flex flex-col gap-2"
			>
				<h2 className="font-heading text-base font-semibold text-muted-foreground">
					En la sala
				</h2>
				<ul className="flex flex-col gap-2">
					{participants.map((p) => {
						const hasQuestion = view.questionAuthorIds.has(p.memberId);
						// Espectador declarado por sí mismo (optOut) o pasado
						// por el Moderador (role): en ambos casos mira,
						// no le falta pregunta.
						const isSpectator = p.role === "spectator" || p.optOut;
						const isOwn = p.memberId === userId;
						const ready = !isSpectator && hasQuestion;
						const status = isSpectator
							? "espectando"
							: hasQuestion
								? "listo"
								: "falta pregunta";
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
										{p.memberId === userId && (
											<Badge variant="default">Tú</Badge>
										)}
										{p.memberId === moderatorId && (
											<Badge variant="secondary">Modera</Badge>
										)}
										{isSpectator && <Badge variant="outline">Mira</Badge>}
									</span>
									<PresenceEstado estado="en_sesion" />
								</span>
								<span className="inline-flex shrink-0 items-center gap-2">
									<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
										<HugeiconsIcon
											icon={ready ? Tick01Icon : Clock01Icon}
											strokeWidth={2}
											aria-hidden="true"
											className={
												ready ? "size-4 text-primary" : "size-4 opacity-50"
											}
										/>
										{status}
									</span>
									{isOwn && <LeaveSessionButton sessionId={sessionId} />}
								</span>
							</li>
						);
					})}
				</ul>
			</section>

			{isModerator && missing.length > 0 && (
				<section
					aria-label="Revisión del moderador"
					className="flex flex-col gap-3 border-t border-border/60 pt-4"
				>
					<p className="text-sm font-medium">{gate.headline}</p>
					{gate.canAdvance &&
						missing.map((m) => {
							const decision = advanceFor?.[m.memberId] ?? "wait";
							return (
								<div
									key={m.memberId}
									className="flex items-center justify-between gap-3"
								>
									<span className="text-sm">{m.displayName}</span>
									<div className="flex gap-2">
										<Button
											size="xs"
											variant={decision === "wait" ? "default" : "outline"}
											disabled={pending}
											onClick={() =>
												onAdvanceForChange?.({
													...advanceFor,
													[m.memberId]: "wait",
												})
											}
										>
											Esperar
										</Button>
										<Button
											size="xs"
											variant={decision === "spectator" ? "default" : "outline"}
											disabled={pending}
											onClick={() =>
												onAdvanceForChange?.({
													...advanceFor,
													[m.memberId]: "spectator",
												})
											}
										>
											Entra mirando
										</Button>
									</div>
								</div>
							);
						})}
				</section>
			)}
		</div>
	);
}
