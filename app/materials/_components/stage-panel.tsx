"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StageTimer } from "@/app/materials/_components/stage-timer";
import {
	PHASE_LABELS,
	SUGGESTED_SECONDS,
} from "@/app/materials/_lib/intervention";
import {
	continueIntervention,
	revealNext,
	saveNotes,
} from "@/app/materials/_lib/room-actions";
import type { RoomDebateSnapshot } from "@/app/materials/_lib/room-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/server-action";

type Props = {
	debate: RoomDebateSnapshot;
	sessionId: string;
	userId: string;
	isModerator: boolean;
};

export function StagePanel({ debate, sessionId, userId, isModerator }: Props) {
	const [pending, start] = useTransition();
	const router = useRouter();

	function act(fn: () => Promise<ActionResult>) {
		start(async () => {
			const r = await fn();
			if (!r.ok) toast.error(r.error);
			else router.refresh();
		});
	}

	if (debate.mode === "done") {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Debate libre</CardTitle>
					<CardDescription>No quedan asignaciones por revelar.</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (debate.mode === "waiting_reveal") {
		const total = debate.revealOrder + debate.remainingHidden;
		return (
			<div className="flex flex-col items-center gap-8 py-10 text-center">
				<p className="text-sm text-muted-foreground uppercase tracking-wide">
					Próximo
				</p>
				<p className="font-heading text-3xl font-semibold">
					{debate.nextAssigneeName}
				</p>
				<p className="text-muted-foreground text-sm">
					Intervención {debate.revealOrder + 1}/{total} · Pregunta oculta ·{" "}
					{debate.remainingHidden} por revelar
				</p>
				{isModerator && (
					<Button
						size="lg"
						disabled={pending}
						onClick={() => act(() => revealNext(sessionId))}
					>
						Revelar
					</Button>
				)}
			</div>
		);
	}

	// mode === "active"
	const state = debate.state;
	const suggested = SUGGESTED_SECONDS[state] ?? 120;
	const isAssignee = debate.assigneeId === userId;
	const showNotes = isAssignee && state === "preparation";
	const total = debate.revealOrder + debate.remainingHidden;

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col items-center gap-4 text-center">
				<p className="text-sm text-muted-foreground uppercase tracking-wide">
					Intervención {debate.revealOrder}/{total}
				</p>
				<Badge variant="secondary">{PHASE_LABELS[state]}</Badge>
				<p className="font-heading text-2xl md:text-3xl font-medium max-w-2xl leading-snug">
					{debate.questionText}
				</p>
				<p className="text-sm text-muted-foreground">
					{state === "preparation" && `Preparación · ${debate.assigneeName}`}
					{state === "exposition" && `Expone ${debate.assigneeName}`}
					{state === "complement" && `Complementa ${debate.authorName}`}
				</p>
				{(state === "preparation" ||
					state === "exposition" ||
					state === "complement") && (
					<StageTimer
						key={`${debate.assignmentId}-${state}`}
						startedAt={debate.phaseStartedAt}
						suggestedSeconds={suggested}
						showExtend={isModerator}
						showPause={isModerator}
					/>
				)}
			</div>

			{showNotes && (
				<NotesBox
					assignmentId={debate.assignmentId}
					sessionId={sessionId}
					initial={debate.myNotes ?? ""}
					pending={pending}
					act={act}
				/>
			)}

			{isModerator && (
				<div className="flex flex-wrap justify-center gap-2">
					{state !== "complete" && (
						<Button
							disabled={pending}
							onClick={() => act(() => continueIntervention(sessionId))}
						>
							Continuar
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

function NotesBox({
	assignmentId,
	sessionId,
	initial,
	pending,
	act,
}: {
	assignmentId: string;
	sessionId: string;
	initial: string;
	pending: boolean;
	act: (fn: () => Promise<ActionResult>) => void;
}) {
	const [text, setText] = useState(initial);

	return (
		<Card className="max-w-lg mx-auto w-full">
			<CardHeader>
				<CardTitle className="text-base">Tus notas</CardTitle>
				<CardDescription>
					Solo en tu teléfono · Momento de preparación
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<Textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					rows={4}
					placeholder="Ideas para la exposición…"
				/>
				<Button
					size="sm"
					disabled={pending}
					onClick={() => act(() => saveNotes(assignmentId, sessionId, text))}
				>
					Guardar notas
				</Button>
			</CardContent>
		</Card>
	);
}
