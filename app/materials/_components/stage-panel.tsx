"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import {
	EXTEND_SECONDS,
	elapsedSeconds,
	SUGGESTED_SECONDS,
} from "@/app/materials/_lib/intervention";
import {
	continueIntervention,
	revealNext,
} from "@/app/materials/_lib/room-actions";
import type { RoomDebateSnapshot } from "@/app/materials/_lib/room-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Active = Extract<RoomDebateSnapshot, { mode: "active" }>;

type Props = {
	debate: RoomDebateSnapshot;
	sessionId: string;
	userId: string;
	isModerator: boolean;
	/** Autor de la pregunta activa — para “te toca complementar”. */
	authorId?: string | null;
};

export function StagePanel({
	debate,
	sessionId,
	userId,
	isModerator,
	authorId = null,
}: Props) {
	if (debate.mode === "done") {
		return (
			<Enter>
				<p className="py-10 text-center text-muted-foreground">
					No quedan turnos. Pueden seguir hablando.
				</p>
			</Enter>
		);
	}

	if (debate.mode === "waiting_reveal") {
		return (
			<WaitingReveal
				debate={debate}
				sessionId={sessionId}
				userId={userId}
				isModerator={isModerator}
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
		/>
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

function fmt(total: number) {
	const n = Math.max(0, total);
	return `${Math.floor(n / 60)}:${(n % 60).toString().padStart(2, "0")}`;
}

function useRemaining(startedAt: string, suggested: number) {
	const startedMs = Date.parse(startedAt);
	const [extra, setExtra] = useState(0);
	const [elapsed, setElapsed] = useState(() =>
		elapsedSeconds(startedMs, Date.now()),
	);

	useEffect(() => {
		const id = setInterval(() => {
			setElapsed(elapsedSeconds(startedMs, Date.now()));
		}, 500);
		return () => clearInterval(id);
	}, [startedMs]);

	return {
		remaining: Math.max(0, suggested + extra - elapsed),
		extend: () => setExtra((e) => e + EXTEND_SECONDS),
	};
}

function Enter({ children }: { children: ReactNode }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			exit={{ opacity: 0, filter: "blur(8px)" }}
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
}: {
	debate: Extract<RoomDebateSnapshot, { mode: "waiting_reveal" }>;
	sessionId: string;
	userId: string;
	isModerator: boolean;
}) {
	const { pending, run } = useRoomMutation();
	const youNext = debate.nextAssigneeId === userId;

	return (
		<Enter>
			<div className="flex min-h-64 flex-col items-center justify-center gap-4 py-12 text-center">
				<p className="text-sm text-muted-foreground">
					{youNext ? "Te toca en un momento." : "Espera."}
				</p>
				<p className="font-heading text-4xl font-semibold">
					{debate.nextAssigneeName}
				</p>
				{isModerator && (
					<Button
						disabled={pending}
						onClick={() => run(() => revealNext(sessionId))}
					>
						Revelar pregunta
					</Button>
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
}: {
	debate: Active;
	sessionId: string;
	userId: string;
	isModerator: boolean;
	authorId: string | null;
}) {
	const copy = turnCopy(debate, userId, authorId);
	const timer = useRemaining(
		debate.phaseStartedAt,
		SUGGESTED_SECONDS[debate.state] ?? 120,
	);
	const { pending, run } = useRoomMutation();

	return (
		<AnimatePresence mode="wait">
			<Enter key={`${debate.assignmentId}-${debate.state}`}>
				<div className="flex flex-col gap-10 py-2 lg:gap-16 lg:py-6">
					<header className="flex flex-col gap-2">
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

					<p className="font-heading mx-auto max-w-3xl text-center text-2xl font-medium text-pretty leading-snug lg:text-4xl">
						{debate.questionText}
					</p>

					<div className="flex flex-col items-center gap-3">
						<p
							className={cn(
								"font-heading text-5xl tabular-nums tracking-tight lg:text-7xl",
								timer.remaining === 0
									? "text-muted-foreground"
									: "text-foreground",
							)}
						>
							{fmt(timer.remaining)}
						</p>
						{isModerator && (
							<Button variant="ghost" onClick={timer.extend}>
								+1 min
							</Button>
						)}
					</div>

					{isModerator && (
						<div className="pt-4">
							<Button
								disabled={pending}
								onClick={() => run(() => continueIntervention(sessionId))}
							>
								Siguiente
							</Button>
						</div>
					)}
				</div>
			</Enter>
		</AnimatePresence>
	);
}
