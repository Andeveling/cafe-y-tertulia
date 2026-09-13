"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import {
	formatClock,
	interventionNextLabel,
	interventionProgressLine,
	phaseClockCaption,
	phaseClockLabel,
	remainingSeconds,
	SUGGESTED_SECONDS,
} from "@/app/materials/_lib/intervention";
import {
	advanceRoomStage,
	continueIntervention,
	revealNext,
	saveNotes,
} from "@/app/materials/_lib/room-actions";
import type { RoomDebateSnapshot } from "@/app/materials/_lib/room-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Active = Extract<RoomDebateSnapshot, { mode: "active" }>;

type Props = {
	debate: RoomDebateSnapshot;
	sessionId: string;
	userId: string;
	isModerator: boolean;
	/** Autor de la pregunta activa — para “te toca complementar”. */
	authorId?: string | null;
	/** Progreso de intervenciones para “X de Y”. */
	progress?: { current: number; total: number } | null;
};

export function StagePanel({
	debate,
	sessionId,
	userId,
	isModerator,
	authorId = null,
	progress = null,
}: Props) {
	if (debate.mode === "done") {
		return <DebateDone sessionId={sessionId} isModerator={isModerator} />;
	}

	if (debate.mode === "waiting_reveal") {
		return (
			<WaitingReveal
				debate={debate}
				sessionId={sessionId}
				userId={userId}
				isModerator={isModerator}
				progress={progress}
			/>
		);
	}

	return (
		<ActiveTurn
			debate={debate}
			sessionId={sessionId}
			userId={userId}
			isModerator={isModerator}
			authorId={authorId}
			progress={progress}
		/>
	);
}

function DebateDone({
	sessionId,
	isModerator,
}: {
	sessionId: string;
	isModerator: boolean;
}) {
	const { pending, run } = useRoomMutation();

	return (
		<Enter>
			<div
				className="flex flex-col items-start gap-4 py-8 text-left"
				role="status"
				aria-live="polite"
			>
				<p className="font-heading text-2xl font-medium lg:text-3xl">
					Debate terminado
				</p>
				<p className="max-w-md text-sm text-muted-foreground">
					{isModerator
						? "Todas las intervenciones se completaron. En Cierre se califica el material y se cierra la sesión: ahí se actualizan conteos e insignias."
						: "Todas las intervenciones se completaron. Los conteos e insignias se actualizan cuando el moderador cierra la sesión en Cierre."}
				</p>
				{isModerator && (
					<ModeratorZone>
						<Button
							disabled={pending}
							onClick={() => run(() => advanceRoomStage(sessionId, "cierre"))}
						>
							Continuar a Cierre
							<HugeiconsIcon
								icon={ArrowRight01Icon}
								strokeWidth={2}
								data-icon="inline-end"
								aria-hidden="true"
							/>
						</Button>
					</ModeratorZone>
				)}
			</div>
		</Enter>
	);
}

function turnCopy(debate: Active, userId: string, authorId: string | null) {
	const youAssignee = debate.assigneeId === userId;
	const youAuthor = authorId === userId;
	if (debate.state === "preparation") {
		return youAssignee
			? { you: true, line: "Te toca." }
			: {
					you: false,
					line: `${debate.assigneeName} tiene la palabra. Tú escuchas.`,
				};
	}
	if (debate.state === "exposition") {
		return youAssignee
			? { you: true, line: "Te toca hablar." }
			: { you: false, line: `Escuchas a ${debate.assigneeName}.` };
	}
	if (debate.state === "complement") {
		return youAuthor
			? { you: true, line: "Te toca complementar." }
			: {
					you: false,
					line: `${debate.authorName} complementa. Tú escuchas.`,
				};
	}
	return { you: false, line: "" };
}

function PairLine({ debate }: { debate: Active }) {
	if (debate.state === "complement") {
		return (
			<p className="text-base text-pretty lg:text-lg">
				<span className="font-medium text-foreground">{debate.authorName}</span>
				<span className="text-muted-foreground"> complementa</span>
			</p>
		);
	}
	return (
		<p className="text-base text-pretty lg:text-lg">
			<span className="font-medium text-foreground">{debate.assigneeName}</span>
			<span className="text-muted-foreground"> responde la pregunta de </span>
			<span className="font-medium text-foreground">{debate.authorName}</span>
		</p>
	);
}

/**
 * Reloj compartido del Escenario: deriva del ancla `phaseStartedAt` que
 * emite el servidor, sin offsets locales — Moderador y Participantes ven
 * lo mismo. Orientativo: nunca fuerza transiciones (ADR 0002).
 */
function useSharedClock(startedAt: string, suggested: number) {
	const startedMs = Date.parse(startedAt);
	const [nowMs, setNowMs] = useState(() => Date.now());

	useEffect(() => {
		const id = setInterval(() => {
			setNowMs(Date.now());
		}, 500);
		return () => clearInterval(id);
	}, []);

	return remainingSeconds(startedMs, suggested, nowMs);
}

function ModeratorZone({ children }: { children: ReactNode }) {
	return (
		<div className="flex w-full flex-col items-start gap-2 border-t border-border/60 pt-4">
			<p className="text-xs font-medium">Moderación</p>
			<p className="text-xs text-muted-foreground">Solo tú ves esto.</p>
			{children}
		</div>
	);
}

function Enter({ children }: { children: ReactNode }) {
	const reduce = useReducedMotion();
	return (
		<motion.div
			initial={reduce ? false : { opacity: 0, y: 16, filter: "blur(10px)" }}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			exit={reduce ? undefined : { opacity: 0, filter: "blur(8px)" }}
			transition={{
				type: "spring",
				visualDuration: 0.5,
				bounce: 0.08,
				opacity: { duration: 0.4, ease: "easeOut" },
				filter: { duration: 0.45, ease: "easeOut" },
			}}
		>
			{children}
		</motion.div>
	);
}

function WaitingReveal({
	debate,
	sessionId,
	userId,
	isModerator,
	progress,
}: {
	debate: Extract<RoomDebateSnapshot, { mode: "waiting_reveal" }>;
	sessionId: string;
	userId: string;
	isModerator: boolean;
	progress?: { current: number; total: number } | null;
}) {
	const { pending, run } = useRoomMutation();
	const youNext = debate.nextAssigneeId === userId;

	return (
		<Enter>
			<div className="flex flex-col items-start gap-3 py-8 text-left">
				{progress && progress.total > 0 && (
					<p className="text-xs tabular-nums text-muted-foreground">
						{interventionProgressLine(progress.current, progress.total)}
					</p>
				)}
				<p className="text-sm text-muted-foreground">
					{youNext ? "Te toca en un momento." : "Espera."}
				</p>
				<p className="font-heading text-3xl font-semibold lg:text-4xl">
					{debate.nextAssigneeName}
				</p>
				{!isModerator && !youNext && (
					<p className="max-w-sm text-sm text-muted-foreground">
						El moderador revela la siguiente pregunta.
					</p>
				)}
				{isModerator && (
					<ModeratorZone>
						<Button
							disabled={pending}
							onClick={() => run(() => revealNext(sessionId))}
						>
							Revelar pregunta
						</Button>
					</ModeratorZone>
				)}
			</div>
		</Enter>
	);
}

function ActiveTurn({
	debate,
	sessionId,
	userId,
	isModerator,
	authorId,
	progress,
}: {
	debate: Active;
	sessionId: string;
	userId: string;
	isModerator: boolean;
	authorId: string | null;
	progress?: { current: number; total: number } | null;
}) {
	const copy = turnCopy(debate, userId, authorId);
	const suggested = SUGGESTED_SECONDS[debate.state] ?? 120;
	const remaining = useSharedClock(debate.phaseStartedAt, suggested);
	const { pending, run } = useRoomMutation();
	const isAssignee = debate.assigneeId === userId;
	const isPreparation = debate.state === "preparation";
	// Se reinicia por assignmentId vía el `key` del <Enter> padre.
	const [notesDraft, setNotesDraft] = useState(debate.myNotes ?? "");

	function handleSaveNotes() {
		const trimmed = notesDraft.trim();
		run(
			() => saveNotes(debate.assignmentId, sessionId, trimmed),
			() => {
				toast.success("Notas guardadas");
			},
		);
	}

	return (
		<AnimatePresence mode="wait">
			<Enter key={`${debate.assignmentId}-${debate.state}`}>
				<div className="flex max-w-3xl flex-col items-start gap-8 py-2 text-left lg:py-4">
					<header className="flex flex-col items-start gap-1.5">
						{progress && progress.total > 0 && (
							<p className="text-xs tabular-nums text-muted-foreground">
								{interventionProgressLine(
									progress.current,
									progress.total,
									debate.state,
								)}
							</p>
						)}
						<p
							className={cn(
								"text-sm",
								copy.you ? "text-primary" : "text-muted-foreground",
							)}
						>
							{copy.line}
						</p>
						<PairLine debate={debate} />
					</header>

					<p className="font-heading max-w-3xl text-left text-2xl font-medium text-pretty leading-snug lg:text-3xl">
						{debate.questionText}
					</p>

					{isAssignee && isPreparation && (
						<div className="flex w-full max-w-xl flex-col items-start gap-1.5">
							<label htmlFor="notas-respuesta" className="text-sm font-medium">
								Tus notas de respuesta
							</label>
							<p className="text-xs text-muted-foreground">
								Privadas. Solo tú las ves hasta exponer.
							</p>
							<Textarea
								id="notas-respuesta"
								value={notesDraft}
								onChange={(e) => setNotesDraft(e.target.value)}
								rows={4}
								placeholder="Ideas principales, palabras clave…"
								disabled={pending}
							/>
							<div className="flex justify-start">
								<Button
									size="sm"
									disabled={pending || !notesDraft.trim()}
									onClick={handleSaveNotes}
								>
									Guardar notas
								</Button>
							</div>
						</div>
					)}

					{isAssignee && !isPreparation && debate.myNotes && (
						<div className="flex w-full max-w-xl flex-col items-start gap-1.5">
							<p className="text-sm font-medium">Tus notas</p>
							<p className="w-full rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
								{debate.myNotes}
							</p>
						</div>
					)}

					<div className="flex flex-col items-start gap-1">
						<p className="text-xs text-muted-foreground">
							{phaseClockLabel(debate.state)}
						</p>
						<p
							className={cn(
								"font-heading text-4xl tabular-nums tracking-tight lg:text-5xl",
								remaining === 0 ? "text-muted-foreground" : "text-foreground",
							)}
						>
							{formatClock(remaining)}
						</p>
						<p className="text-xs text-muted-foreground">
							{phaseClockCaption(remaining)}
						</p>
					</div>

					{isModerator && (
						<ModeratorZone>
							<Button
								disabled={pending}
								onClick={() => run(() => continueIntervention(sessionId))}
							>
								{interventionNextLabel(debate.state)}
							</Button>
						</ModeratorZone>
					)}
				</div>
			</Enter>
		</AnimatePresence>
	);
}
