"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StageTimer } from "@/app/materials/_components/stage-timer";
import {
	type AssignmentState,
	PHASE_LABELS,
	SUGGESTED_SECONDS,
} from "@/app/materials/_lib/intervention";
import type { StageSnapshot } from "@/app/materials/_lib/stage";
import {
	continueIntervention,
	revealNext,
	saveNotes,
} from "@/app/materials/_lib/stage-actions";
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

type Props = {
	stage: StageSnapshot;
	userId: string;
	isModerator: boolean;
};

export function StagePanel({ stage, userId, isModerator }: Props) {
	const [pending, start] = useTransition();
	const router = useRouter();

	function act(fn: () => Promise<{ error: string } | { success: true }>) {
		start(async () => {
			const r = await fn();
			if ("error" in r) toast.error(r.error);
			else router.refresh();
		});
	}

	if (stage.mode === "done") {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Debate libre</CardTitle>
					<CardDescription>No quedan asignaciones por revelar.</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (stage.mode === "waiting_reveal") {
		return (
			<div className="flex flex-col items-center gap-8 py-10 text-center">
				<p className="text-sm text-muted-foreground uppercase tracking-wide">
					Próximo
				</p>
				<p className="font-heading text-3xl font-semibold">
					{stage.nextAssigneeName}
				</p>
				<p className="text-muted-foreground text-sm">
					Pregunta oculta · {stage.remainingHidden} por revelar
				</p>
				{isModerator && (
					<Button
						size="lg"
						disabled={pending}
						onClick={() => act(() => revealNext(stage.sessionId))}
					>
						Revelar
					</Button>
				)}
			</div>
		);
	}

	const state = stage.state as AssignmentState;
	const suggested = SUGGESTED_SECONDS[state] ?? 120;
	const isAssignee = stage.assigneeId === userId;
	const showNotes = isAssignee && state === "preparation";

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col items-center gap-4 text-center">
				<Badge variant="secondary">{PHASE_LABELS[state]}</Badge>
				<p className="font-heading text-2xl md:text-3xl font-medium max-w-2xl leading-snug">
					{stage.questionText}
				</p>
				<p className="text-sm text-muted-foreground">
					{state === "preparation" && `Preparación · ${stage.assigneeName}`}
					{state === "exposition" && `Expone ${stage.assigneeName}`}
					{state === "complement" && `Complementa ${stage.authorName}`}
				</p>
				{(state === "preparation" ||
					state === "exposition" ||
					state === "complement") && (
					<StageTimer
						key={`${stage.assignmentId}-${state}`}
						suggestedSeconds={suggested}
						showExtend={isModerator}
					/>
				)}
			</div>

			{showNotes && (
				<NotesBox
					assignmentId={stage.assignmentId}
					sessionId={stage.sessionId}
					initial={stage.myNotes ?? ""}
					pending={pending}
					act={act}
				/>
			)}

			{isModerator && (
				<div className="flex flex-wrap justify-center gap-2">
					{state !== "complete" && (
						<Button
							disabled={pending}
							onClick={() => act(() => continueIntervention(stage.sessionId))}
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
	act: (fn: () => Promise<{ error: string } | { success: true }>) => void;
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
