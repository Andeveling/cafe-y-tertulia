"use client";

import { FullScreenIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HeartPicker } from "@/app/materials/_components/heart-picker";
import { Enter } from "@/app/materials/_components/stage-enter";
import {
	ConfirmActionButton,
	ModeratorZone,
} from "@/app/materials/_components/stage-moderation";
import {
	type ActiveDebate,
	buildSeats,
	SEAT_ROLE_LABEL,
	turnCopy,
} from "@/app/materials/_components/stage-turn";
import { TurnSpotlight } from "@/app/materials/_components/turn-spotlight";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import {
	heartEligibility,
	heartsPhaseState,
} from "@/app/materials/_lib/hearts";
import {
	interventionDisplay,
	interventionNextLabel,
} from "@/app/materials/_lib/intervention";
import {
	castHeart,
	continueIntervention,
	extendExposition,
} from "@/app/materials/_lib/room-actions";
import type { RoomParticipant } from "@/app/materials/_lib/room-types";
import { sharedNow } from "@/app/materials/_lib/shared-now";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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

export function ActiveTurn({
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
	debate: ActiveDebate;
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
		speakerAvatar: isComplement ? debate.authorAvatar : debate.assigneeAvatar,
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
										<span aria-hidden="true">
											<MemberAvatar
												name={seat.name}
												avatar={seat.avatar}
												className={cn(
													"size-10 font-heading",
													seat.role === "speaker"
														? "ring-1 ring-primary/30 [&_[data-slot=avatar-fallback]]:bg-primary/15 [&_[data-slot=avatar-fallback]]:text-sm [&_[data-slot=avatar-fallback]]:text-primary"
														: "ring-1 ring-foreground/15 [&_[data-slot=avatar-fallback]]:bg-foreground/[0.04] [&_[data-slot=avatar-fallback]]:text-sm [&_[data-slot=avatar-fallback]]:text-muted-foreground",
												)}
											/>
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
