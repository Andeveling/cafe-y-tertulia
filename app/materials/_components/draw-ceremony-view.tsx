"use client";

import { DiceIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
	clampOptimisticPhase,
	drawCeremonyPhase,
} from "@/app/materials/_lib/draw-ceremony";
import type {
	RoomAssignment,
	RoomReadiness,
} from "@/app/materials/_lib/room-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;

const enterSpring = {
	type: "spring" as const,
	visualDuration: 0.55,
	bounce: 0.08,
};

const phaseTransition = { duration: 0.4, ease: EASE };

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
	done: boolean;
	createdAt: string | null;
	assignments: RoomAssignment[];
	readiness: RoomReadiness;
	userId: string;
	isModerator: boolean;
	pending?: boolean;
	onExecute?: () => void;
	/**
	 * Reloj sin snapshot autoritativo (del evento realtime): el countdown
	 * arranca igual, pero reveal/settled se congelan en fanfarria hasta que
	 * lleguen las asignaciones — evita flashes de resultados vacíos.
	 */
	optimistic?: boolean;
	/** Congela el reloj — stories / tests. */
	nowMs?: number;
	reducedMotion?: boolean;
};

export function DrawCeremonyView({
	done,
	createdAt,
	assignments,
	readiness,
	userId,
	isModerator,
	pending = false,
	onExecute,
	optimistic = false,
	nowMs,
	reducedMotion,
}: Props) {
	const reduced = usePrefersReducedMotion(reducedMotion);
	const sorted = [...assignments].sort((a, b) => a.revealOrder - b.revealOrder);
	const now = useCeremonyNow(
		nowMs,
		done && !reduced,
		createdAt,
		sorted.length,
		reduced,
	);
	// En optimista aún no hay asignaciones: pairCount>=1 evita que el
	// countdown colapse a settled antes de tiempo; el clamp congela el
	// reveal hasta el snapshot autoritativo.
	const pairCount = optimistic ? Math.max(sorted.length, 1) : sorted.length;
	const phase = done
		? clampOptimisticPhase(
				drawCeremonyPhase(createdAt, now, pairCount, reduced),
				optimistic,
			)
		: null;

	if (!done) {
		return (
			<WaitingDraw
				readiness={readiness}
				isModerator={isModerator}
				pending={pending}
				onExecute={onExecute}
			/>
		);
	}

	const revealed =
		phase?.kind === "reveal" ? phase.revealedCount : sorted.length;
	const visible = sorted.slice(0, revealed);

	return (
		<AnimatePresence mode="wait">
			{phase?.kind === "countdown" ? (
				<CountdownBeat key="countdown" count={phase.count} />
			) : phase?.kind === "fanfare" ? (
				<FanfareBeat key="fanfare" />
			) : (
				<ResultsBeat
					key="results"
					visible={visible}
					total={sorted.length}
					userId={userId}
					settled={phase?.kind === "settled"}
					reduced={reduced}
				/>
			)}
		</AnimatePresence>
	);
}

function WaitingDraw({
	readiness,
	isModerator,
	pending,
	onExecute,
}: {
	readiness: RoomReadiness;
	isModerator: boolean;
	pending: boolean;
	onExecute?: () => void;
}) {
	const isEmpty = readiness.total === 0;
	return (
		<div className="flex flex-col items-center gap-8 py-10 text-center">
			<div className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
				<HugeiconsIcon
					icon={DiceIcon}
					strokeWidth={1.75}
					className="size-8"
					aria-hidden="true"
				/>
			</div>
			<div className="flex flex-col gap-2">
				<h2 className="font-heading text-2xl font-semibold text-balance">
					El sorteo está listo
				</h2>
				<p className="max-w-sm text-sm text-muted-foreground text-pretty">
					Cuenta atrás compartida. Luego ves a quién te tocó — el texto espera
					al debate.
				</p>
			</div>
			<p className="text-sm text-muted-foreground tabular-nums">
				<span className="font-heading text-2xl font-semibold text-foreground">
					{readiness.ready}
				</span>
				<span className="text-muted-foreground">/{readiness.total} listos</span>
			</p>
			{isModerator ? (
				isEmpty ? (
					<div className="flex flex-col items-center gap-1">
						<Button disabled>Sortear</Button>
						<p className="text-xs text-muted-foreground">
							Se necesita al menos un participante para sortear.
						</p>
					</div>
				) : (
					<Button disabled={pending} onClick={onExecute}>
						Sortear
					</Button>
				)
			) : (
				<p className="text-sm text-muted-foreground">
					Espera a que el moderador haga el sorteo.
				</p>
			)}
		</div>
	);
}

function CountdownBeat({ count }: { count: 3 | 2 | 1 }) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, filter: "blur(8px)" }}
			transition={phaseTransition}
			className="flex min-h-64 flex-col items-center justify-center py-16"
			aria-live="assertive"
			aria-atomic="true"
		>
			<p className="mb-6 text-sm text-muted-foreground">Sorteo en</p>
			<AnimatePresence mode="wait">
				<motion.p
					key={count}
					initial={{ opacity: 0, y: 12, filter: "blur(10px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
					transition={{ duration: 0.4, ease: EASE }}
					className="font-heading text-[clamp(4.5rem,18vw,8rem)] leading-none font-semibold text-primary tabular-nums"
				>
					{count}
				</motion.p>
			</AnimatePresence>
		</motion.div>
	);
}

function FanfareBeat() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			exit={{ opacity: 0, filter: "blur(8px)" }}
			transition={phaseTransition}
			className="flex min-h-64 flex-col items-center justify-center gap-3 py-16"
			aria-live="assertive"
		>
			<p className="font-heading text-4xl font-semibold text-primary text-balance">
				Sorteo
			</p>
			<p className="text-sm text-muted-foreground">Las parejas</p>
		</motion.div>
	);
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
	const showHero = Boolean(asAssignee || asAuthor);
	const item = reduced ? resultsItemQuiet : resultsItem;

	return (
		<motion.div
			initial="hidden"
			animate="show"
			exit={{ opacity: 0 }}
			variants={resultsContainer}
			className="flex flex-col gap-8"
		>
			{showHero && (
				<motion.div
					variants={item}
					className="flex flex-col gap-6 rounded-xl bg-primary/10 px-6 py-8 ring-1 ring-primary/25"
				>
					{asAssignee && (
						<div className="flex flex-col gap-1">
							<p className="text-sm text-muted-foreground">Te tocó</p>
							<p className="font-heading text-3xl font-semibold text-balance">
								{asAssignee.authorName}
							</p>
							<p className="text-sm text-muted-foreground">
								Tú expones su pregunta. El texto espera al debate.
							</p>
						</div>
					)}
					{asAuthor && asAuthor.assignmentId !== asAssignee?.assignmentId && (
						<div className="flex flex-col gap-1">
							<p className="text-sm text-muted-foreground">Tu pregunta</p>
							<p className="font-heading text-xl font-semibold text-balance">
								La responde {asAuthor.assigneeName}
							</p>
						</div>
					)}
				</motion.div>
			)}

			{!showHero && settled && (
				<motion.p variants={item} className="text-sm text-muted-foreground">
					Esta ronda miras. Las parejas ya están.
				</motion.p>
			)}

			<motion.ul className="flex flex-col gap-2" variants={resultsContainer}>
				{visible.map((a, i) => {
					const mine = a.assigneeId === userId || a.authorId === userId;
					return (
						<motion.li
							key={a.assignmentId}
							variants={item}
							className={cn(
								"flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm ring-1 ring-foreground/10",
								mine && "bg-primary/10 ring-primary/30",
							)}
						>
							<span>
								<span className="font-medium">{a.authorName}</span>
								<span className="text-muted-foreground"> → </span>
								<span className="font-medium">{a.assigneeName}</span>
							</span>
							{a.assigneeId === userId ? (
								<Badge>Tú</Badge>
							) : (
								<span className="text-xs text-muted-foreground tabular-nums">
									{i + 1}/{total}
								</span>
							)}
						</motion.li>
					);
				})}
			</motion.ul>
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
) {
	const [now, setNow] = useState(() => frozen ?? Date.now());
	useEffect(() => {
		if (frozen != null) {
			setNow(frozen);
			return;
		}
		if (!enabled) return;
		if (
			drawCeremonyPhase(createdAt, Date.now(), pairCount, reduced).kind ===
			"settled"
		) {
			return;
		}
		const id = setInterval(() => {
			const t = Date.now();
			setNow(t);
			if (
				drawCeremonyPhase(createdAt, t, pairCount, reduced).kind === "settled"
			) {
				clearInterval(id);
			}
		}, 80);
		return () => clearInterval(id);
	}, [frozen, enabled, createdAt, pairCount, reduced]);
	return frozen ?? now;
}
