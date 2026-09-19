"use client";

import {
	ArrowRight01Icon,
	Cancel01Icon,
	FavouriteIcon,
	FullScreenIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { HeartPicker } from "@/app/materials/_components/heart-picker";
import { WaitingRevealView } from "@/app/materials/_components/waiting-reveal-view";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import {
	heartEligibility,
	heartsPhaseState,
	heartsProgressText,
} from "@/app/materials/_lib/hearts";
import {
	interventionDisplay,
	interventionNextLabel,
	interventionProgressLine,
} from "@/app/materials/_lib/intervention";
import {
	advanceRoomStage,
	castHeart,
	continueIntervention,
	extendExposition,
	revealNext,
} from "@/app/materials/_lib/room-actions";
import {
	ROOM_STAGE_LABELS,
	type RoomDebateSnapshot,
	type RoomParticipant,
	type RoomStage,
} from "@/app/materials/_lib/room-types";
import type { TurnoAprecio } from "@/app/materials/_lib/room-view";
import { sharedNow } from "@/app/materials/_lib/shared-now";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
	/** Aprecio del último turno completado — se revela entre turnos. */
	lastAprecio?: TurnoAprecio | null;
	/** Mesa completa — para mostrar quién expone, complementa y escucha. */
	members?: RoomParticipant[];
	/** Siguiente en exponer — primera oculta por revealOrder. */
	nextAssigneeName?: string | null;
	/** Reloj del snapshot: primer paint idéntico en SSR e hidratación. */
	asOf?: number;
	/** Congela el reloj — stories / tests. */
	nowMs?: number;
	/** Avance derivado — Nav y Debate → Cierre consumen lo mismo. */
	next?: RoomStage | null;
	empty?: boolean;
	warnings?: string[];
};

export function StagePanel({
	debate,
	sessionId,
	userId,
	isModerator,
	authorId = null,
	progress = null,
	lastAprecio = null,
	members = [],
	nextAssigneeName = null,
	asOf,
	nowMs,
	next = null,
	empty = false,
	warnings = [],
}: Props) {
	if (debate.mode === "done") {
		return (
			<DebateDone
				sessionId={sessionId}
				isModerator={isModerator}
				next={next}
				empty={empty}
				warnings={warnings}
			/>
		);
	}

	if (debate.mode === "waiting_reveal") {
		return (
			<WaitingReveal
				debate={debate}
				sessionId={sessionId}
				userId={userId}
				isModerator={isModerator}
				progress={progress}
				lastAprecio={lastAprecio}
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
			members={members}
			nextAssigneeName={nextAssigneeName}
			asOf={asOf}
			nowMs={nowMs}
		/>
	);
}

function DebateDone({
	sessionId,
	isModerator,
	next,
	empty,
	warnings,
}: {
	sessionId: string;
	isModerator: boolean;
	next: RoomStage | null;
	empty: boolean;
	warnings: string[];
}) {
	const { pending, run } = useRoomMutation();

	function handleAdvance() {
		if (!next || empty) return;
		run(() => advanceRoomStage(sessionId, next));
	}

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
						? "Todos los turnos se completaron. En Cierre se califica el material y se cierra la sesión: ahí se actualizan conteos e insignias."
						: "Todos los turnos se completaron. Los conteos e insignias se actualizan cuando el moderador cierra la sesión en Cierre."}
				</p>
				{isModerator && next && (
					<ModeratorZone>
						<Button disabled={pending || empty} onClick={handleAdvance}>
							Continuar a {ROOM_STAGE_LABELS[next]}
							<HugeiconsIcon
								icon={ArrowRight01Icon}
								strokeWidth={2}
								data-icon="inline-end"
								aria-hidden="true"
							/>
						</Button>
						{empty && (
							<p className="text-xs text-muted-foreground">
								Se necesita al menos un participante para avanzar.
							</p>
						)}
						{warnings.length > 0 && (
							<ul className="flex flex-col gap-1">
								{warnings.map((label) => (
									<li key={label} className="text-sm text-muted-foreground">
										{label}
									</li>
								))}
							</ul>
						)}
					</ModeratorZone>
				)}
			</div>
		</Enter>
	);
}

function turnCopy(debate: Active, userId: string, authorId: string | null) {
	const youAssignee = debate.assigneeId === userId;
	const youAuthor = authorId === userId;
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

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? "";
	const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
	return (first + last).toUpperCase();
}

type SeatRole = "speaker" | "author" | "listener" | "past";

type Seat = {
	key: string;
	name: string;
	isYou: boolean;
	role: SeatRole;
};

const SEAT_ROLE_LABEL: Record<SeatRole, string> = {
	speaker: "En la palabra",
	author: "Complementa",
	listener: "Escucha",
	past: "Expuso",
};

/**
 * Mesa del turno: expositor + autor siempre presentes aunque no estén en
 * `members`, resto escucha. Orden estable (el de la mesa, no el del turno)
 * para no marear en la pantalla compartida.
 */
function buildSeats(
	debate: Active,
	members: RoomParticipant[],
	authorId: string | null,
	userId: string,
): Seat[] {
	const list: RoomParticipant[] = [...members];
	const has = (id: string | null, name: string) =>
		list.some(
			(p) => (id != null && p.memberId === id) || p.displayName === name,
		);
	if (!has(debate.assigneeId, debate.assigneeName)) {
		list.push({
			memberId: debate.assigneeId,
			displayName: debate.assigneeName,
			role: "member",
			optOut: false,
		});
	}
	if (!has(authorId, debate.authorName)) {
		list.push({
			memberId: authorId ?? `name:${debate.authorName}`,
			displayName: debate.authorName,
			role: "member",
			optOut: false,
		});
	}
	const isComplement = debate.state === "complement";
	return list.map((p) => {
		const isAssignee =
			p.memberId === debate.assigneeId || p.displayName === debate.assigneeName;
		const isAuthor =
			(authorId != null && p.memberId === authorId) ||
			p.displayName === debate.authorName;
		const role: SeatRole = isComplement
			? isAuthor
				? "speaker"
				: isAssignee
					? "past"
					: "listener"
			: isAssignee
				? "speaker"
				: isAuthor
					? "author"
					: "listener";
		return {
			key: p.memberId,
			name: p.displayName,
			isYou: p.memberId === userId,
			role,
		};
	});
}

/**
 * Tick del reloj compartido. El display lo arma `interventionDisplay`.
 * No lee Date.now() en el render inicial: SSR e hidratación usan `asOf`.
 * Tras montar, todos tictaquean el mismo reloj de pared (`sharedNow`).
 */
function useSharedClock(startedAt: string, asOf?: number, frozen?: number) {
	const startedMs = Date.parse(startedAt);
	const [wallNow, setWallNow] = useState<number | null>(null);

	useEffect(() => {
		if (frozen != null) return;
		setWallNow(Date.now());
		const id = setInterval(() => setWallNow(Date.now()), 500);
		return () => clearInterval(id);
	}, [frozen]);

	return sharedNow({
		frozen,
		wallNow,
		asOf,
		fallback: startedMs,
	});
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

/** Primer clic arma; segundo confirma; X cancela — evita miss-clicks. */
function ConfirmActionButton({
	label,
	pending,
	onConfirm,
}: {
	label: string;
	pending: boolean;
	onConfirm: () => void;
}) {
	const [armed, setArmed] = useState(false);
	const [lastLabel, setLastLabel] = useState(label);
	if (lastLabel !== label) {
		setLastLabel(label);
		setArmed(false);
	}
	const reduce = useReducedMotion();

	return (
		<div
			className="flex min-h-(--control-height) items-center"
			role="group"
			aria-label={label}
		>
			<AnimatePresence mode="wait" initial={false}>
				{!armed ? (
					<motion.div
						key="idle"
						initial={
							reduce
								? { opacity: 0 }
								: { opacity: 0, x: -12, scale: 0.98, filter: "blur(4px)" }
						}
						animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
						exit={
							reduce
								? { opacity: 0 }
								: { opacity: 0, x: 12, scale: 0.98, filter: "blur(4px)" }
						}
						transition={
							reduce
								? { duration: 0.12, ease: "easeOut" }
								: { duration: 0.14, ease: [0.16, 1, 0.3, 1] }
						}
					>
						<Button disabled={pending} onClick={() => setArmed(true)}>
							{label}
						</Button>
					</motion.div>
				) : (
					<motion.div
						key="armed"
						className="flex items-center gap-1.5"
						initial={
							reduce
								? { opacity: 0 }
								: { opacity: 0, x: 12, scale: 0.98, filter: "blur(4px)" }
						}
						animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
						exit={
							reduce
								? { opacity: 0 }
								: { opacity: 0, x: -12, scale: 0.98, filter: "blur(4px)" }
						}
						transition={
							reduce
								? { duration: 0.12, ease: "easeOut" }
								: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
						}
					>
						<Button disabled={pending} onClick={onConfirm} autoFocus>
							Confirmar
						</Button>
						<Button
							variant="ghost"
							size="icon"
							disabled={pending}
							aria-label="Cancelar"
							onClick={() => setArmed(false)}
						>
							<HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
						</Button>
					</motion.div>
				)}
			</AnimatePresence>
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
	lastAprecio,
}: {
	debate: Extract<RoomDebateSnapshot, { mode: "waiting_reveal" }>;
	sessionId: string;
	userId: string;
	isModerator: boolean;
	progress?: { current: number; total: number } | null;
	lastAprecio?: TurnoAprecio | null;
}) {
	const { pending, run } = useRoomMutation();
	const youNext = debate.nextAssigneeId === userId;
	const progressText =
		progress && progress.total > 0
			? interventionProgressLine(progress.current, progress.total)
			: null;
	const revealLabel =
		progress && progress.total > 0
			? `Revelar pregunta ${progress.current} para ${debate.nextAssigneeName}`
			: `Revelar pregunta para ${debate.nextAssigneeName}`;

	return (
		<Enter>
			<WaitingRevealView
				nextAssigneeName={debate.nextAssigneeName}
				youNext={youNext}
				isModerator={isModerator}
				progressText={progressText}
				revealLabel={revealLabel}
				pending={pending}
				lastAprecio={lastAprecio ?? null}
				onReveal={
					isModerator ? () => run(() => revealNext(sessionId)) : undefined
				}
			/>
		</Enter>
	);
}

/**
 * Foco del turno: hero "En la palabra" + tarjeta del reloj. Se renderiza una
 * sola vez — inline o dentro del Dialog de foco — para no duplicar contenido.
 */
function TurnSpotlight({
	speakerName,
	speakerVerb,
	isComplement,
	authorName,
	questionText,
	clockText,
	overtime,
	timerPct,
	timerAction,
	heartsVoted,
	heartsEligible,
	voter,
}: {
	speakerName: string;
	speakerVerb: string;
	isComplement: boolean;
	authorName: string;
	questionText: string;
	clockText: string;
	overtime: boolean;
	timerPct: number;
	timerAction?: ReactNode;
	heartsVoted?: number;
	heartsEligible?: number;
	/** Votador de corazones — vive dentro de la card del reloj, sin textos. */
	voter?: ReactNode;
}) {
	return (
		<>
			<section
				aria-label="En la palabra"
				className="w-full rounded-xl bg-card px-6 py-8 text-center ring-1 ring-foreground/10"
			>
				<p className="text-label-sm font-bold tracking-[0.1em] text-muted-foreground uppercase">
					En la palabra
				</p>
				<span
					aria-hidden="true"
					className="mx-auto mt-4 grid size-[4.5rem] place-items-center rounded-full bg-primary/10 font-heading text-2xl text-primary ring-1 ring-primary/40"
				>
					{initials(speakerName)}
				</span>
				<p className="font-heading mt-3 text-3xl font-semibold text-balance">
					{speakerName}
				</p>
				<p className="mt-2">
					<span
						className={cn(
							"inline-block rounded-full px-4 py-1 text-xs font-bold tracking-[0.08em] ring-1",
							isComplement
								? "bg-reward/15 text-reward ring-reward/30"
								: "bg-primary/15 text-primary ring-primary/30",
						)}
					>
						{speakerVerb}
					</span>
				</p>
				<div
					aria-hidden="true"
					className="mx-auto my-4 h-px w-16 bg-foreground/15"
				/>
				<p className="text-xs text-muted-foreground">
					Pregunta de {authorName}
				</p>
				<p className="font-heading mx-auto mt-1 max-w-xl text-center text-xl font-medium text-pretty italic leading-snug">
					{questionText}
				</p>
			</section>

			<section
				aria-label="Reloj del turno"
				className="w-full rounded-xl bg-card px-6 py-5 text-center ring-1 ring-foreground/10"
			>
				<div className="flex items-center justify-center gap-3">
					<p
						className={cn(
							"font-heading text-5xl tabular-nums tracking-tight",
							overtime ? "text-destructive" : "text-foreground",
						)}
					>
						{clockText}
					</p>
					{timerAction}
				</div>
				<div
					aria-hidden="true"
					className="mx-auto mt-3 h-1 max-w-md overflow-hidden rounded-full bg-muted"
				>
					<div
						className={cn(
							"h-full rounded-full",
							overtime ? "bg-destructive" : "bg-reward",
						)}
						style={{ width: `${timerPct}%` }}
					/>
				</div>
				{voter && <div className="mt-3">{voter}</div>}
				{heartsVoted != null && heartsEligible != null && (
					<Badge
						variant="outline"
						className="mt-2 tabular-nums"
						role="status"
						aria-live="polite"
						aria-label={`${heartsProgressText(heartsVoted, heartsEligible)} corazones`}
					>
						<HugeiconsIcon
							icon={FavouriteIcon}
							strokeWidth={2}
							className="text-primary"
							aria-hidden="true"
						/>
						{heartsVoted}/{heartsEligible}
					</Badge>
				)}
			</section>
		</>
	);
}

function ActiveTurn({
	debate,
	sessionId,
	userId,
	isModerator,
	authorId,
	progress,
	members,
	nextAssigneeName,
	asOf,
	nowMs,
}: {
	debate: Active;
	sessionId: string;
	userId: string;
	isModerator: boolean;
	authorId: string | null;
	progress?: { current: number; total: number } | null;
	members: RoomParticipant[];
	nextAssigneeName: string | null;
	asOf?: number;
	nowMs?: number;
}) {
	const copy = turnCopy(debate, userId, authorId);
	const now = useSharedClock(debate.phaseStartedAt, asOf, nowMs);
	const clock = interventionDisplay(debate.state, debate.phaseStartedAt, now);
	const { pending, run } = useRoomMutation();
	const isComplement = debate.state === "complement";
	const speakerName = isComplement ? debate.authorName : debate.assigneeName;
	const speakerVerb = isComplement ? "COMPLEMENTA" : "EXPONE";
	const seats = buildSeats(debate, members, authorId, userId);
	const showProgress = progress != null && progress.total > 0;
	const progressPct = showProgress
		? Math.min(100, Math.round((progress.current / progress.total) * 100))
		: 0;

	function handleExtend() {
		run(
			() => extendExposition(debate.assignmentId, sessionId),
			() => {
				toast.success("+1 min · quedó registrado");
			},
		);
	}

	// Modo foco: hero + reloj en Dialog, abierto por defecto mientras el
	// turno vive. Se reabre solo en cada turno/fase; al cerrarlo se alterna
	// con la vista inline de siempre.
	const turnKey = `${debate.assignmentId}-${debate.state}`;
	const [dismissedKey, setDismissedKey] = useState<string | null>(null);
	const focusOpen = dismissedKey !== turnKey;
	function handleFocusOpenChange(open: boolean) {
		setDismissedKey(open ? null : turnKey);
	}
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);
	const spotHostRef = useRef<HTMLDivElement>(null);

	const extendBtn =
		isModerator && !isComplement ? (
			<Button
				variant="outline"
				size="sm"
				disabled={pending}
				onClick={handleExtend}
			>
				+1 min
			</Button>
		) : null;

	const hearts = debate.hearts;
	// Fase votable: exposición o complemento con corazones en el snapshot.
	const votablePhase =
		hearts && (debate.state === "exposition" || debate.state === "complement")
			? debate.state
			: null;
	const canVote =
		votablePhase != null &&
		hearts != null &&
		heartsPhaseState({
			phase: votablePhase,
			authorId,
			eligibleCount: hearts.eligible,
		}) === "vote" &&
		heartEligibility({
			phase: votablePhase,
			userId,
			assigneeId: debate.assigneeId,
			authorId,
		}).eligible;
	const handleHeartVote = useCallback(
		(value: number) => {
			if (votablePhase == null) return;
			run(() => castHeart(debate.assignmentId, votablePhase, value, sessionId));
		},
		[run, votablePhase, debate.assignmentId, sessionId],
	);
	// Sin textos: el picker se explica solo junto al conteo. Quien no puede
	// votar (expositor/autor) solo ve el conteo.
	const voter =
		canVote && hearts ? (
			<HeartPicker
				value={hearts.myHeart}
				disabled={pending}
				onVote={handleHeartVote}
			/>
		) : null;
	const spotlightProps = {
		speakerName,
		speakerVerb,
		isComplement,
		authorName: debate.authorName,
		questionText: debate.questionText,
		clockText: clock.text,
		overtime: clock.overtime,
		timerPct: clock.pct,
		timerAction: extendBtn,
		heartsVoted: hearts?.voted,
		heartsEligible: hearts?.eligible,
	};
	const spotlight = <TurnSpotlight {...spotlightProps} voter={voter} />;

	return (
		<div ref={spotHostRef} className="contents">
			<AnimatePresence mode="wait">
				<Enter key={`${debate.assignmentId}-${debate.state}`}>
					<div className="flex max-w-4xl flex-col items-start gap-6 py-2 text-left lg:py-4">
						<div className="flex w-full flex-wrap items-center gap-2">
							{showProgress && (
								<p className="text-sm tabular-nums text-muted-foreground">
									Turno {progress.current} de {progress.total}
								</p>
							)}
							<span
								className={cn(
									"rounded-full px-3 py-0.5 text-label-sm font-bold tracking-wider uppercase ring-1",
									isComplement
										? "bg-reward/10 text-reward ring-reward/25"
										: "bg-primary/10 text-primary ring-primary/25",
								)}
							>
								{isComplement ? "Complemento" : "Exposición"}
							</span>
							{showProgress && (
								<span className="ml-auto hidden items-center gap-2 sm:flex">
									<span
										aria-hidden="true"
										className="h-1 w-20 overflow-hidden rounded-full bg-muted"
									>
										<span
											className="block h-full rounded-full bg-reward"
											style={{ width: `${progressPct}%` }}
										/>
									</span>
									<span className="text-label-sm text-muted-foreground tabular-nums">
										{progress.current} / {progress.total}
									</span>
								</span>
							)}
							{!focusOpen && (
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => handleFocusOpenChange(true)}
									aria-label="Abrir foco en pantalla completa"
									className={!showProgress ? "ml-auto" : undefined}
								>
									<HugeiconsIcon
										icon={FullScreenIcon}
										strokeWidth={2}
										aria-hidden="true"
									/>
								</Button>
							)}
						</div>

						{isModerator && !focusOpen && (
							<ModeratorZone>
								<ConfirmActionButton
									label={interventionNextLabel(debate.state)}
									pending={pending}
									onConfirm={() => run(() => continueIntervention(sessionId))}
								/>
							</ModeratorZone>
						)}

						{!focusOpen && spotlight}

						<div aria-hidden="true" className="h-px w-full bg-foreground/10" />

						<section
							aria-label="La mesa"
							className="flex w-full flex-col gap-2"
						>
							<p className="text-label-sm font-bold tracking-[0.1em] text-muted-foreground uppercase">
								La mesa
							</p>
							<ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
								{seats.map((seat) => (
									<li
										key={seat.key}
										className={cn(
											"relative flex flex-col items-center gap-1 rounded-xl px-3 py-4 text-center ring-1",
											seat.role === "speaker"
												? "bg-primary/[0.07] ring-primary/30"
												: "ring-foreground/10",
										)}
									>
										{seat.isYou && (
											<span className="absolute -top-2 rounded-full bg-card px-2 py-0.5 text-label-sm font-bold tracking-wider text-primary uppercase ring-1 ring-primary/30">
												Tú
											</span>
										)}
										<span
											aria-hidden="true"
											className={cn(
												"grid size-10 place-items-center rounded-full font-heading text-sm ring-1",
												seat.role === "speaker"
													? "bg-primary/15 text-primary ring-primary/30"
													: "bg-foreground/[0.04] text-muted-foreground ring-foreground/15",
											)}
										>
											{initials(seat.name)}
										</span>
										<span className="w-full truncate text-xs font-medium">
											{seat.name}
										</span>
										<span
											className={cn(
												"rounded-full px-2.5 py-0.5 text-label-sm font-bold tracking-wider uppercase ring-1",
												seat.role === "speaker"
													? "bg-primary/15 text-primary ring-primary/30"
													: seat.role === "author"
														? "bg-reward/10 text-reward ring-reward/25"
														: "text-muted-foreground ring-foreground/15",
											)}
										>
											{SEAT_ROLE_LABEL[seat.role]}
										</span>
										{nextAssigneeName != null &&
											seat.name === nextAssigneeName &&
											seat.role !== "speaker" && (
												<span className="rounded-full bg-reward/15 px-2 py-0.5 text-label-sm font-semibold text-reward ring-1 ring-reward/25">
													Siguiente
												</span>
											)}
									</li>
								))}
							</ul>
							{nextAssigneeName && (
								<p className="text-center text-xs text-muted-foreground">
									Siguiente en exponer:{" "}
									<span className="font-medium text-reward">
										{nextAssigneeName}
									</span>
								</p>
							)}
						</section>

						<p
							role="status"
							className="flex w-full items-center gap-2 rounded-lg bg-card px-4 py-3 text-sm ring-1 ring-foreground/10"
						>
							<span
								aria-hidden="true"
								className={cn(
									"size-2 shrink-0 rounded-full",
									copy.you ? "bg-primary" : "bg-muted-foreground/40",
								)}
							/>
							<span className={cn(!copy.you && "text-muted-foreground")}>
								{copy.line}
							</span>
						</p>
					</div>
				</Enter>
			</AnimatePresence>
			{mounted && (
				<Dialog open={focusOpen} onOpenChange={handleFocusOpenChange}>
					<DialogContent
						container={spotHostRef.current ?? undefined}
						className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-background p-4 sm:max-w-3xl sm:p-8"
					>
						<DialogTitle className="sr-only">
							Foco del turno: {speakerName}
						</DialogTitle>
						{isModerator && (
							<div className="sticky top-0 z-10 w-fit bg-background pb-4">
								<ConfirmActionButton
									label={interventionNextLabel(debate.state)}
									pending={pending}
									onConfirm={() => run(() => continueIntervention(sessionId))}
								/>
							</div>
						)}
						{spotlight}
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
