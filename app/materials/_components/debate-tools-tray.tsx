"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRoomMutation } from "../_hooks/use-room-mutation";
import {
	answerTriviaAction,
	closeTakeAction,
	finishTriviaAction,
	lockTriviaAction,
	nextTriviaAction,
	startTakeAction,
	startTriviaAction,
	voteTakeAction,
} from "../_lib/minigame-actions";
import type { MinigameState, TriviaRoundSnapshot } from "../_lib/minigames";
import {
	ROOM_OK_RESULT,
	type RoomFormAction,
	roomFormData,
} from "../_lib/room-sync";

/**
 * Bandeja de herramientas del Debate: trivia y takes viven dentro de la Sala.
 * El foco central conserva turno y temporizador; esta bandeja es auxiliar.
 * Los límites (1–2 rondas de trivia, ≤3 takes por Sesión) los fuerza el RPC
 * y la bandeja los refleja ocultando los lanzadores agotados.
 */
type Props = {
	sessionId: string;
	state: MinigameState;
	round: TriviaRoundSnapshot | null;
	isModerator: boolean;
};

/** Lo que las secciones internas necesitan para disparar acciones. */
type TrayActions = {
	sessionId: string;
	pending: boolean;
	isModerator: boolean;
	run: (action: RoomFormAction, fields: Record<string, string>) => void;
};

export function DebateToolsTray({
	sessionId,
	state,
	round,
	isModerator,
}: Props) {
	const { pending, run } = useRoomMutation();
	const [takePrompt, setTakePrompt] = useState("");

	/** Acciones con formulario sobre el camino único de mutación de la Sala. */
	function runFields(action: RoomFormAction, fields: Record<string, string>) {
		run(() => action(ROOM_OK_RESULT, roomFormData(fields)));
	}

	const canLaunchTrivia =
		isModerator && !state.liveRoundId && state.triviaRoundCount < 2;
	const canLaunchTake = isModerator && !state.openTakeId && state.takeCount < 3;

	const hasContent = round != null || state.takes.length > 0;
	const actions = { sessionId, pending, isModerator, run: runFields };

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Herramientas</CardTitle>
				<CardDescription>
					Trivia y takes sin perder el turno actual
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-5">
				{round?.status === "live" && <TriviaLive round={round} {...actions} />}

				{round?.status === "board" && <Scoreboard round={round} />}

				{state.takes.length > 0 && (
					<TakesSection takes={state.takes} {...actions} />
				)}

				{!hasContent && !canLaunchTrivia && !canLaunchTake && (
					<p className="text-sm text-muted-foreground">
						Trivia y takes aparecerán aquí durante el debate.
					</p>
				)}

				{(canLaunchTrivia || canLaunchTake) && (
					<div className="flex flex-col gap-3 border-t border-border pt-4">
						<p className="text-xs uppercase tracking-wide text-muted-foreground">
							Lanzar · máx. 2 trivias y 3 takes por sesión
						</p>
						{canLaunchTrivia &&
							(state.bank.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No hay trivias en el banco del material.
								</p>
							) : (
								<div className="flex flex-wrap gap-2">
									{state.bank.map((t) => (
										<Button
											key={t.id}
											variant="outline"
											size="sm"
											disabled={pending}
											onClick={() =>
												runFields(startTriviaAction, {
													session_id: sessionId,
													trivia_id: t.id,
												})
											}
										>
											{t.title}
											{t.itemCount ? ` · ${t.itemCount}p` : ""}
										</Button>
									))}
								</div>
							))}
						{canLaunchTake && (
							<div className="flex gap-2">
								<Input
									placeholder="Frase disparadora"
									aria-label="Frase disparadora del take"
									value={takePrompt}
									onChange={(e) => setTakePrompt(e.target.value)}
								/>
								<Button
									size="sm"
									disabled={pending || !takePrompt.trim()}
									onClick={() => {
										runFields(startTakeAction, {
											session_id: sessionId,
											prompt: takePrompt,
										});
										setTakePrompt("");
									}}
								>
									Lanzar take
								</Button>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// ─── Trivia ─────────────────────────────────────────────────

function TriviaLive({
	round,
	sessionId,
	pending,
	isModerator,
	run,
}: TrayActions & { round: TriviaRoundSnapshot }) {
	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm text-muted-foreground">
				Trivia · Pregunta {round.questionIndex + 1}/{round.questionCount}
			</p>
			<p className="font-medium">{round.prompt}</p>
			<div className="grid gap-2">
				{(round.options ?? []).map((opt, i) => (
					<Button
						key={i}
						variant={round.myOption === i ? "default" : "outline"}
						size="sm"
						disabled={pending || round.locked || round.myOption != null}
						onClick={() =>
							run(answerTriviaAction, {
								round_id: round.roundId,
								session_id: sessionId,
								option_index: String(i),
							})
						}
					>
						{opt}
						{round.optionCounts ? ` · ${round.optionCounts[i]}` : ""}
					</Button>
				))}
			</div>
			{isModerator && (
				<div className="flex flex-wrap gap-2">
					{!round.locked ? (
						<Button
							size="sm"
							variant="secondary"
							disabled={pending}
							onClick={() =>
								run(lockTriviaAction, {
									round_id: round.roundId,
									session_id: sessionId,
								})
							}
						>
							Cerrar pregunta
						</Button>
					) : (
						<>
							<Button
								size="sm"
								variant="secondary"
								disabled={pending}
								onClick={() =>
									run(nextTriviaAction, {
										round_id: round.roundId,
										session_id: sessionId,
									})
								}
							>
								Siguiente
							</Button>
							<Button
								size="sm"
								disabled={pending}
								onClick={() =>
									run(finishTriviaAction, {
										round_id: round.roundId,
										session_id: sessionId,
									})
								}
							>
								Marcador
							</Button>
						</>
					)}
				</div>
			)}
		</div>
	);
}

function Scoreboard({ round }: { round: TriviaRoundSnapshot }) {
	return (
		<div className="flex flex-col gap-2">
			<p className="text-sm text-muted-foreground">Marcador de trivia</p>
			{round.winnerName && (
				<p className="text-sm font-medium">
					🏆 {round.winnerName} · Memoria de elefante
				</p>
			)}
			<ul className="space-y-1">
				{round.scoreboard.map((r) => (
					<li key={r.memberId} className="flex justify-between text-sm">
						<span>{r.displayName}</span>
						<span className="tabular-nums">{r.hits}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

// ─── Takes ──────────────────────────────────────────────────

function TakesSection({
	takes,
	sessionId,
	pending,
	isModerator,
	run,
}: TrayActions & { takes: MinigameState["takes"] }) {
	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm text-muted-foreground">
				Takes · voto anónimo, solo conteos
			</p>
			{takes.map((t) => (
				<div
					key={t.id}
					className="rounded-md border border-border p-3 space-y-2"
				>
					<p className="text-sm font-medium">{t.prompt}</p>
					<p className="text-sm text-muted-foreground">
						👍 {t.counts.agree} · 😐 {t.counts.neutral} · 👎 {t.counts.disagree}
					</p>
					{t.status === "open" && (
						<div className="flex flex-wrap gap-2">
							{(
								[
									["agree", "De acuerdo"],
									["neutral", "Neutral"],
									["disagree", "En desacuerdo"],
								] as const
							).map(([pos, label]) => (
								<Button
									key={pos}
									size="sm"
									variant="outline"
									disabled={pending}
									onClick={() =>
										run(voteTakeAction, {
											take_id: t.id,
											session_id: sessionId,
											position: pos,
										})
									}
								>
									{label}
								</Button>
							))}
							{isModerator && (
								<Button
									size="sm"
									disabled={pending}
									onClick={() =>
										run(closeTakeAction, {
											take_id: t.id,
											session_id: sessionId,
										})
									}
								>
									Cerrar
								</Button>
							)}
						</div>
					)}
				</div>
			))}
		</div>
	);
}
