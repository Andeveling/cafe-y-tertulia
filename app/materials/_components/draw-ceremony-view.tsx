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
import { MemberAvatar } from "@/components/member-avatar";
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
			Cada uno responde una pregunta ajena — nunca la propia. El texto sigue
			oculto hasta su intervención.
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
						Sorteando quién responde
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
						El orden aparece en segundos.
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

function pad2(n: number) {
	return String(n).padStart(2, "0");
}

function personLabel(name: string) {
	const trimmed = name.trim();
	return trimmed || "Miembro";
}

function NameInSentence({
	name,
	avatar,
}: {
	name: string;
	avatar: string | null;
}) {
	const label = personLabel(name);
	return (
		<>
			<span aria-hidden="true" className="me-1.5 inline-flex align-middle">
				<MemberAvatar name={label} avatar={avatar} size="sm" />
			</span>
			<span className="font-semibold">{label}</span>
		</>
	);
}

function PairSentence({
	assignment,
	userId,
}: {
	assignment: RoomAssignment;
	userId: string;
}) {
	if (assignment.assigneeId === userId) {
		return (
			<>
				<span className="font-semibold">Tú</span> respondes la pregunta de{" "}
				<NameInSentence
					name={assignment.authorName}
					avatar={assignment.authorAvatar}
				/>
				.
			</>
		);
	}
	if (assignment.authorId === userId) {
		return (
			<>
				<NameInSentence
					name={assignment.assigneeName}
					avatar={assignment.assigneeAvatar}
				/>{" "}
				responde <span className="font-semibold">tu pregunta</span>.
			</>
		);
	}
	return (
		<>
			<NameInSentence
				name={assignment.assigneeName}
				avatar={assignment.assigneeAvatar}
			/>{" "}
			responde la pregunta de{" "}
			<NameInSentence
				name={assignment.authorName}
				avatar={assignment.authorAvatar}
			/>
			.
		</>
	);
}

function ResultsBeat({
	visible,
	userId,
	settled,
	reduced,
}: {
	visible: RoomAssignment[];
	userId: string;
	settled: boolean;
	reduced: boolean;
}) {
	const involved = visible.some(
		(a) => a.assigneeId === userId || a.authorId === userId,
	);
	const item = reduced ? resultsItemQuiet : resultsItem;

	return (
		<motion.div
			initial={reduced ? false : "hidden"}
			animate="show"
			exit={reduced ? undefined : { opacity: 0 }}
			variants={resultsContainer}
			className="flex flex-col gap-8"
		>
			{!involved && settled && (
				<motion.p
					variants={item}
					className="text-sm text-pretty text-muted-foreground"
				>
					Miras esta ronda. No respondes ninguna pregunta.
				</motion.p>
			)}

			<section aria-label="Orden de intervención">
				<h2 className="mb-3 font-heading text-xl font-semibold text-balance">
					Orden de intervención
				</h2>
				<motion.ol className="flex flex-col gap-3" variants={resultsContainer}>
					{visible.map((a, i) => {
						const mine = a.assigneeId === userId || a.authorId === userId;
						return (
							<motion.li
								key={a.assignmentId}
								variants={item}
								className={cn(
									"flex items-start gap-4 rounded-xl px-4 py-4 ring-1",
									mine ? "bg-primary/10 ring-primary/30" : "ring-foreground/10",
								)}
							>
								<span
									aria-hidden="true"
									className={cn(
										"w-10 shrink-0 pt-1 font-heading text-2xl leading-none tabular-nums",
										mine ? "text-primary" : "text-muted-foreground",
									)}
								>
									{pad2(i + 1)}
								</span>
								<p className="min-w-0 text-pretty text-base leading-8">
									<PairSentence assignment={a} userId={userId} />
								</p>
							</motion.li>
						);
					})}
				</motion.ol>
				<p className="mt-4 max-w-prose text-sm text-pretty text-muted-foreground">
					El texto de cada pregunta sigue oculto hasta su intervención.
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
