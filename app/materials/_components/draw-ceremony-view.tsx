"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
	assembleDrawCeremony,
	type DrawCeremonySlice,
	drawCeremonyPhase,
} from "@/app/materials/_lib/draw-ceremony";
import type {
	RoomAssignment,
	RoomReadiness,
} from "@/app/materials/_lib/room-types";
import { sharedNow } from "@/app/materials/_lib/shared-now";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const enterSpring = {
	type: "spring" as const,
	visualDuration: 0.55,
	bounce: 0.08,
};

const resultsContainer = {
	hidden: {},
	show: {
		transition: { staggerChildren: 0.1, delayChildren: 0.08 },
	},
};

const resultsItem = {
	hidden: { opacity: 0, y: 22, filter: "blur(12px)" },
	show: {
		opacity: 1,
		y: 0,
		filter: "blur(0px)",
		transition: {
			...enterSpring,
			opacity: { duration: 0.45, ease: "easeOut" as const },
			filter: { duration: 0.5, ease: "easeOut" as const },
		},
	},
};

const resultsItemQuiet = {
	hidden: { opacity: 0 },
	show: { opacity: 1, transition: { duration: 0.25 } },
};

type Props = {
	/** Slice de Sala: draw + assignments + participants. Sin flags de reloj. */
	snapshot: DrawCeremonySlice & {
		readiness: RoomReadiness;
		asOf?: number;
	};
	userId: string;
	isModerator: boolean;
	pending?: boolean;
	onExecute?: () => void;
	/** Adaptador del reloj realtime — stories y DrawCeremony lo inyectan. */
	optimisticCreatedAt?: string | null;
	/** Congela el reloj — stories / tests. */
	nowMs?: number;
	reducedMotion?: boolean;
};

export function DrawCeremonyView({
	snapshot,
	userId,
	isModerator,
	pending = false,
	onExecute,
	optimisticCreatedAt,
	nowMs,
	reducedMotion,
}: Props) {
	const [skipMotion, setSkipMotion] = useState(false);
	const reduced = usePrefersReducedMotion(reducedMotion) || skipMotion;
	const clock = assembleDrawCeremony(snapshot, {
		nowMs: nowMs ?? 0,
		optimisticCreatedAt,
		reducedMotion: reduced,
	});
	const now = useCeremonyNow(
		nowMs,
		clock.started && !reduced,
		clock.createdAt,
		clock.pairCount,
		reduced,
		snapshot.asOf,
	);
	const ceremony = assembleDrawCeremony(snapshot, {
		nowMs: now,
		optimisticCreatedAt,
		reducedMotion: reduced,
	});
	const sorted = [...ceremony.assignments].sort(
		(a, b) => a.revealOrder - b.revealOrder,
	);
	const phase = ceremony.phase;
	const started = ceremony.started;

	const spinning = started && phase?.kind === "countdown";
	const locking = started && phase?.kind === "fanfare";
	const awaitingPairs = started && ceremony.assignments.length === 0;

	const spectators = snapshot.participants.filter(
		(p) => p.role === "spectator" || p.optOut,
	);
	const me = snapshot.participants.find((p) => p.memberId === userId);
	const iWatch = me ? me.role === "spectator" || me.optOut : false;

	if (!started || spinning || locking) {
		return (
			<SorteoBeat
				count={phase?.kind === "countdown" ? phase.count : null}
				fanfare={locking}
				awaiting={locking && awaitingPairs}
				inCycle={ceremony.people.length}
				spectatorCount={spectators.length}
				iWatch={iWatch}
				readiness={snapshot.readiness}
				isModerator={isModerator}
				pending={pending}
				onExecute={onExecute}
				onSkip={spinning || locking ? () => setSkipMotion(true) : undefined}
			/>
		);
	}

	const revealed =
		phase?.kind === "reveal" ? phase.revealedCount : sorted.length;
	const visible = sorted.slice(0, revealed);

	return (
		<AnimatePresence mode="wait">
			<ResultsBeat
				key="results"
				visible={visible}
				total={sorted.length}
				userId={userId}
				settled={phase?.kind === "settled"}
				reduced={reduced}
			/>
		</AnimatePresence>
	);
}

function GuaranteeLine() {
	return (
		<p className="max-w-md text-sm text-muted-foreground text-pretty">
			Cada uno expone una pregunta ajena — nadie la propia. El texto se revela
			en tu turno.
		</p>
	);
}

function SorteoBeat({
	count,
	fanfare,
	awaiting,
	inCycle,
	spectatorCount,
	iWatch,
	readiness,
	isModerator,
	pending,
	onExecute,
	onSkip,
}: {
	count: 3 | 2 | 1 | null;
	fanfare: boolean;
	awaiting: boolean;
	inCycle: number;
	spectatorCount: number;
	iWatch: boolean;
	readiness: RoomReadiness;
	isModerator: boolean;
	pending: boolean;
	onExecute?: () => void;
	onSkip?: () => void;
}) {
	const inMotion = count != null || fanfare;
	const canDraw = readiness.total >= 2;
	const cycleLabel =
		inCycle === 0
			? "Sin participantes todavía."
			: `${inCycle} ${inCycle === 1 ? "persona" : "personas"} en el ciclo.`;
	return (
		<div className="flex flex-col items-center gap-6 px-4 py-8 text-center">
			{count != null ? (
				<div
					role="status"
					aria-live="assertive"
					aria-label={`Sorteando, ${count}`}
					className="flex flex-col items-center gap-3"
				>
					<motion.span
						key={count}
						initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
						className="font-heading text-7xl font-semibold text-primary tabular-nums"
					>
						{count}
					</motion.span>
					<h2 className="font-heading text-2xl font-semibold text-balance">
						{iWatch ? "Sorteando las misiones" : "Sorteando tu misión"}
					</h2>
				</div>
			) : fanfare ? (
				<div
					role="status"
					aria-live="assertive"
					aria-label={awaiting ? "Revelando, esperando a la sala" : "Revelando"}
					className="flex flex-col items-center gap-3"
				>
					<h2 className="font-heading text-2xl font-semibold text-balance">
						Revelando
					</h2>
					{awaiting && (
						<p className="text-sm text-muted-foreground">
							Esperando a la sala…
						</p>
					)}
				</div>
			) : (
				<div className="flex flex-col items-center gap-2">
					<h2 className="font-heading text-2xl font-semibold text-balance">
						El sorteo está listo
					</h2>
					<p className="text-sm text-muted-foreground">{cycleLabel}</p>
				</div>
			)}
			<GuaranteeLine />
			{iWatch && (
				<p className="text-sm text-muted-foreground">Miras esta ronda.</p>
			)}
			{!inMotion && !iWatch && spectatorCount > 0 && (
				<p className="text-xs text-muted-foreground">
					{spectatorCount} {spectatorCount === 1 ? "mira" : "miran"} esta ronda.
				</p>
			)}
			{inMotion ? (
				isModerator && onSkip ? (
					<Button variant="ghost" size="sm" onClick={onSkip}>
						Saltar animación
					</Button>
				) : !isModerator ? (
					<p className="text-sm text-muted-foreground">
						{iWatch
							? "Las misiones aparecen en segundos."
							: "Tu misión aparece en segundos."}
					</p>
				) : null
			) : (
				<>
					{isModerator ? (
						canDraw ? (
							<Button disabled={pending} onClick={onExecute}>
								Sortear
							</Button>
						) : (
							<div className="flex flex-col items-center gap-1">
								<Button disabled>Sortear</Button>
								<p className="text-xs text-muted-foreground">
									{readiness.total === 0
										? "Se necesita al menos un participante para sortear."
										: "Se necesitan al menos 2 participantes para sortear."}
								</p>
							</div>
						)
					) : (
						<p className="text-sm text-muted-foreground">
							Espera a que el moderador haga el sorteo.
						</p>
					)}
				</>
			)}
		</div>
	);
}

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? "";
	const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
	return (first + last).toUpperCase();
}

function pad2(n: number) {
	return String(n).padStart(2, "0");
}

function ResultsBeat({
	visible,
	total,
	userId,
	settled,
	reduced,
}: {
	visible: RoomAssignment[];
	total: number;
	userId: string;
	settled: boolean;
	reduced: boolean;
}) {
	const asAssignee = visible.find((a) => a.assigneeId === userId);
	const asAuthor = visible.find((a) => a.authorId === userId);
	const answersOwn =
		asAuthor && asAuthor.assignmentId !== asAssignee?.assignmentId
			? asAuthor
			: undefined;
	const showHero = Boolean(asAssignee || answersOwn);
	const item = reduced ? resultsItemQuiet : resultsItem;
	const exposeTurn = asAssignee
		? visible.findIndex((a) => a.assignmentId === asAssignee.assignmentId) + 1
		: 0;
	const answerTurn = answersOwn
		? visible.findIndex((a) => a.assignmentId === answersOwn.assignmentId) + 1
		: 0;
	const missionCount = (asAssignee ? 1 : 0) + (answersOwn ? 1 : 0);

	return (
		<motion.div
			initial="hidden"
			animate="show"
			exit={{ opacity: 0 }}
			variants={resultsContainer}
			className="flex flex-col gap-8"
		>
			{showHero && (
				<section aria-label="Tu misión">
					<div className="mb-3 flex items-baseline justify-between gap-4">
						<h2 className="font-heading text-xl font-semibold">Tu misión</h2>
						<span className="text-xs text-muted-foreground">
							{missionCount} intervención{missionCount > 1 ? "es" : ""}
						</span>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						{asAssignee && (
							<motion.article
								variants={item}
								aria-label={`Te toca exponer la pregunta de ${asAssignee.authorName}`}
								className="flex flex-col gap-3 rounded-xl bg-primary/10 px-6 py-6 ring-1 ring-primary/25"
							>
								<div className="flex items-center justify-between gap-3">
									<p className="text-label-sm font-bold tracking-[0.1em] text-primary uppercase">
										Tú expones
									</p>
									<span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-label-sm font-semibold text-primary ring-1 ring-primary/25">
										Intervención {exposeTurn}/{total}
									</span>
								</div>
								<p className="font-heading text-3xl font-semibold text-balance">
									{asAssignee.authorName}
								</p>
								<p className="font-heading text-lg text-muted-foreground italic">
									Expones su pregunta.
								</p>
								<div aria-hidden="true" className="h-px bg-primary/25" />
								<p className="flex items-center gap-2 text-xs text-muted-foreground">
									<span
										aria-hidden="true"
										className="size-1.5 shrink-0 rounded-full bg-primary"
									/>
									El texto se revela al abrir Debate.
								</p>
							</motion.article>
						)}
						{answersOwn && (
							<motion.article
								variants={item}
								aria-label={`Tu pregunta la responde ${answersOwn.assigneeName}`}
								className="flex flex-col gap-3 rounded-xl px-6 py-6 ring-1 ring-foreground/10"
							>
								<div className="flex items-center justify-between gap-3">
									<p className="text-label-sm font-bold tracking-[0.1em] text-muted-foreground uppercase">
										Tu pregunta
									</p>
									<span className="rounded-full bg-foreground/[0.05] px-2.5 py-0.5 text-label-sm font-semibold text-muted-foreground ring-1 ring-foreground/15">
										Intervención {answerTurn}/{total}
									</span>
								</div>
								<p className="font-heading text-xl font-semibold text-balance">
									{answersOwn.assigneeName}
								</p>
								<p className="font-heading text-lg text-muted-foreground italic">
									La responde por ti.
								</p>
								<div aria-hidden="true" className="h-px bg-foreground/10" />
								<p className="flex items-center gap-2 text-xs text-muted-foreground">
									<span
										aria-hidden="true"
										className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50"
									/>
									Expone tu pregunta en su turno.
								</p>
							</motion.article>
						)}
					</div>
				</section>
			)}

			{!showHero && settled && (
				<motion.p variants={item} className="text-sm text-muted-foreground">
					Esta ronda miras. Las parejas ya están.
				</motion.p>
			)}

			<section aria-label="Orden de intervención">
				<div className="mb-3 flex items-baseline justify-between gap-4">
					<h2 className="font-heading text-xl font-semibold">
						Orden de intervención
					</h2>
					<span className="text-xs text-muted-foreground tabular-nums">
						{total} turno{total > 1 ? "s" : ""}
					</span>
				</div>
				<motion.ol className="flex flex-col gap-2" variants={resultsContainer}>
					{visible.map((a, i) => {
						const mine = a.assigneeId === userId || a.authorId === userId;
						const iExpose = a.assigneeId === userId;
						const authorIsMe = a.authorId === userId;
						const assigneeIsMe = a.assigneeId === userId;
						return (
							<motion.li
								key={a.assignmentId}
								variants={item}
								className={cn(
									"grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl px-4 py-3 ring-1",
									mine ? "bg-primary/10 ring-primary/30" : "ring-foreground/10",
								)}
							>
								<span
									className={cn(
										"font-heading text-2xl tabular-nums",
										mine ? "text-primary" : "text-muted-foreground/60",
									)}
								>
									{pad2(i + 1)}
								</span>
								<span className="flex min-w-0 items-center gap-2 text-sm">
									<span
										aria-hidden="true"
										className={cn(
											"grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1",
											authorIsMe
												? "bg-primary/10 text-primary ring-primary/30"
												: "bg-foreground/[0.04] text-foreground ring-foreground/15",
										)}
									>
										{initials(a.authorName)}
									</span>
									<span className="min-w-0 truncate font-medium">
										{a.authorName}
									</span>
									<span
										aria-hidden="true"
										className="shrink-0 text-muted-foreground"
									>
										→
									</span>
									<span
										aria-hidden="true"
										className={cn(
											"grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1",
											assigneeIsMe
												? "bg-primary/10 text-primary ring-primary/30"
												: "bg-foreground/[0.04] text-foreground ring-foreground/15",
										)}
									>
										{initials(a.assigneeName)}
									</span>
									<span className="min-w-0 truncate font-medium">
										{a.assigneeName}
									</span>
								</span>
								<span className="flex shrink-0 flex-col items-end gap-1">
									{mine ? (
										<Badge>Tú</Badge>
									) : (
										<span className="text-xs text-muted-foreground tabular-nums">
											{i + 1}/{total}
										</span>
									)}
									{mine && (
										<span className="text-label-sm font-semibold tracking-wider text-muted-foreground uppercase">
											{iExpose ? "Expones" : "Te responden"}
										</span>
									)}
								</span>
							</motion.li>
						);
					})}
				</motion.ol>
				<p className="mt-2 flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground ring-1 ring-foreground/10">
					<span
						aria-hidden="true"
						className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50"
					/>
					Los textos se ocultan hasta el debate.
				</p>
			</section>
		</motion.div>
	);
}

function usePrefersReducedMotion(forced?: boolean) {
	const [reduced, setReduced] = useState(forced ?? false);
	useEffect(() => {
		if (forced != null) {
			setReduced(forced);
			return;
		}
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(mq.matches);
		const onChange = () => setReduced(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [forced]);
	return reduced;
}

function useCeremonyNow(
	frozen: number | undefined,
	enabled: boolean,
	createdAt: string | null,
	pairCount: number,
	reduced: boolean,
	asOf?: number,
) {
	const [wallNow, setWallNow] = useState<number | null>(null);
	const parsed = createdAt ? Date.parse(createdAt) : 0;
	const fallback = Number.isFinite(parsed) ? parsed : 0;

	useEffect(() => {
		if (frozen != null) return;
		if (!enabled) return;
		if (
			drawCeremonyPhase(createdAt, Date.now(), pairCount, reduced).kind ===
			"settled"
		) {
			setWallNow(Date.now());
			return;
		}
		setWallNow(Date.now());
		const id = setInterval(() => {
			const t = Date.now();
			setWallNow(t);
			if (
				drawCeremonyPhase(createdAt, t, pairCount, reduced).kind === "settled"
			) {
				clearInterval(id);
			}
		}, 80);
		return () => clearInterval(id);
	}, [frozen, enabled, createdAt, pairCount, reduced]);

	return sharedNow({ frozen, wallNow, asOf, fallback });
}
