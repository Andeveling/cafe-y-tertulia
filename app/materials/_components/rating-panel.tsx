"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ActionResult } from "@/lib/server-action";
import type { RatingProgress } from "../_lib/rating";
import {
	castVoteAction,
	clearRatingAction,
	closeRatingAction,
	openRatingAction,
} from "../_lib/rating-actions";

type Props = { progress: RatingProgress };

const ok: ActionResult = { ok: true };

export function RatingPanel({ progress }: Props) {
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

	const frozen = progress.ratingCount > 0 && !progress.ratingOpen;

	return (
		<div className="flex flex-col gap-4">
			{frozen && (
				<Card>
					<CardHeader>
						<CardTitle>Rating de la sesión</CardTitle>
						<CardDescription>Congelado · votos descartados</CardDescription>
					</CardHeader>
					<CardContent className="flex items-baseline gap-2">
						<span className="text-3xl font-semibold tabular-nums">
							{progress.ratingAvg ?? "—"}
						</span>
						<span className="text-muted-foreground text-sm">
							★ · {progress.ratingCount} voto
							{progress.ratingCount === 1 ? "" : "s"}
						</span>
					</CardContent>
				</Card>
			)}

			{progress.isModerator &&
				progress.sessionStatus === "in_progress" &&
				!progress.ratingOpen &&
				!frozen && (
					<Card>
						<CardHeader>
							<CardTitle>Rating</CardTitle>
							<CardDescription>
								Abre la votación al terminar el debate
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								disabled={pending}
								onClick={() =>
									run(openRatingAction, { session_id: progress.sessionId })
								}
							>
								Abrir votación
							</Button>
						</CardContent>
					</Card>
				)}

			{progress.ratingOpen && (
				<>
					{progress.isModerator && (
						<Card>
							<CardHeader>
								<CardTitle>Progreso</CardTitle>
								<CardDescription>Sin nombres</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col gap-3">
								<p className="text-2xl font-semibold tabular-nums">
									{progress.voted} de {progress.total}
								</p>
								<Button
									disabled={pending}
									onClick={() =>
										run(closeRatingAction, {
											session_id: progress.sessionId,
										})
									}
								>
									Cerrar votación
								</Button>
							</CardContent>
						</Card>
					)}

					{progress.isParticipant && (
						<Card>
							<CardHeader>
								<CardTitle>Tu voto</CardTitle>
								<CardDescription>
									1–5★ · anónimo · puedes cambiarlo
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-wrap gap-2">
								{[1, 2, 3, 4, 5].map((n) => (
									<Button
										key={n}
										variant={progress.myStars === n ? "default" : "outline"}
										size="lg"
										disabled={pending}
										onClick={() =>
											run(castVoteAction, {
												session_id: progress.sessionId,
												stars: String(n),
											})
										}
									>
										{n}★
									</Button>
								))}
							</CardContent>
						</Card>
					)}
				</>
			)}

			{progress.isModerator &&
				progress.sessionStatus === "closed" &&
				frozen && (
					<Button
						variant="ghost"
						size="sm"
						disabled={pending}
						onClick={() =>
							run(clearRatingAction, { session_id: progress.sessionId })
						}
					>
						Borrar rating de la sesión
					</Button>
				)}
		</div>
	);
}
