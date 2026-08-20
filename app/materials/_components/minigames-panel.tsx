"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/server-action";
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

type Props = {
	sessionId: string;
	state: MinigameState;
	round: TriviaRoundSnapshot | null;
	isModerator: boolean;
};

const ok: ActionResult = { ok: true };

function useAct() {
	const router = useRouter();
	const [pending, start] = useTransition();
	function run(
		action: (p: ActionResult, f: FormData) => Promise<ActionResult>,
		fields: Record<string, string>,
	) {
		start(async () => {
			const fd = new FormData();
			for (const [k, v] of Object.entries(fields)) fd.set(k, v);
			await action(ok, fd);
			router.refresh();
		});
	}
	return { pending, run };
}

export function MinigamesPanel({
	sessionId,
	state,
	round,
	isModerator,
}: Props) {
	const { pending, run } = useAct();
	const [takePrompt, setTakePrompt] = useState("");
	const [startState] = useActionState(startTriviaAction, ok);

	return (
		<div className="flex flex-col gap-6">
			{round && (
				<Card>
					<CardHeader>
						<CardTitle>
							{round.status === "board" ? "Marcador" : "Trivia"}
						</CardTitle>
						<CardDescription>
							{round.status === "live"
								? `Pregunta ${round.questionIndex + 1} / ${round.questionCount} · ${round.answeredCount} respuestas`
								: "Aciertos por participante"}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						{round.status === "live" && (
							<>
								<p className="text-lg font-medium">{round.prompt}</p>
								<div className="grid gap-2">
									{(round.options ?? []).map((opt, i) => (
										<Button
											key={i}
											variant={round.myOption === i ? "default" : "outline"}
											disabled={
												pending || round.locked || round.myOption != null
											}
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
													variant="secondary"
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
							</>
						)}

						{round.status === "board" && (
							<>
								{round.winnerName && (
									<p className="text-sm font-medium">
										🏆 {round.winnerName} · Memoria de elefante
									</p>
								)}
								<ul className="space-y-1">
									{round.scoreboard.map((r) => (
										<li
											key={r.memberId}
											className="flex justify-between text-sm"
										>
											<span>{r.displayName}</span>
											<span className="tabular-nums">{r.hits}</span>
										</li>
									))}
								</ul>
							</>
						)}
					</CardContent>
				</Card>
			)}

			{isModerator && !state.liveRoundId && state.triviaRoundCount < 2 && (
				<Card>
					<CardHeader>
						<CardTitle>Lanzar trivia</CardTitle>
						<CardDescription>1–2 por sesión</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						{state.bank.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No hay trivias en el banco del material.
							</p>
						) : (
							state.bank.map((t) => (
								<Button
									key={t.id}
									variant="outline"
									disabled={pending}
									onClick={() =>
										run(startTriviaAction, {
											session_id: sessionId,
											trivia_id: t.id,
										})
									}
								>
									{t.title}
									{t.itemCount ? ` · ${t.itemCount}p` : ""}
								</Button>
							))
						)}
						{!startState.ok && (
							<p className="text-sm text-destructive">{startState.error}</p>
						)}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Takes</CardTitle>
					<CardDescription>
						Voto anónimo · solo conteos · sin ganador
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{state.takes.map((t) => (
						<div key={t.id} className="border rounded-md p-3 space-y-2">
							<p className="font-medium">{t.prompt}</p>
							<p className="text-sm text-muted-foreground">
								👍 {t.counts.agree} · 😐 {t.counts.neutral} · 👎{" "}
								{t.counts.disagree}
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

					{isModerator && state.takeCount < 3 && !state.openTakeId && (
						<div className="flex gap-2">
							<Input
								placeholder="Frase disparadora"
								value={takePrompt}
								onChange={(e) => setTakePrompt(e.target.value)}
							/>
							<Button
								disabled={pending || !takePrompt.trim()}
								onClick={() => {
									run(startTakeAction, {
										session_id: sessionId,
										prompt: takePrompt,
									});
									setTakePrompt("");
								}}
							>
								Lanzar
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
