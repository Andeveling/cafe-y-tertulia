"use client";

import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { RatingDisplay } from "@/app/materials/_components/rating-display";
import { useRunAction } from "@/app/materials/_hooks/use-run-action";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { RatingProgress } from "../_lib/rating";
import {
	castVoteAction,
	clearRatingAction,
	closeRatingAction,
	openRatingAction,
} from "../_lib/rating-actions";

type Props = { progress: RatingProgress };

export function RatingPanel({ progress }: Props) {
	const { pending, run } = useRunAction();

	const frozen = progress.ratingCount > 0 && !progress.ratingOpen;

	return (
		<div className="flex flex-col gap-4">
			{frozen && (
				<Card>
					<CardHeader>
						<CardTitle>Rating de la sesión</CardTitle>
						<CardDescription>Congelado · votos descartados</CardDescription>
					</CardHeader>
					<CardContent>
						<RatingDisplay
							value={progress.ratingAvg}
							count={progress.ratingCount}
							size="lg"
						/>
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

			{!progress.ratingOpen && !frozen && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Votación del material</CardTitle>
						<CardDescription>
							{progress.isModerator
								? "Aún cerrada. Ábrela para que el club vote."
								: progress.isParticipant
									? "En espera. El moderador abre la votación en Cierre."
									: "Solo votan los participantes. Puedes mirar el cierre."}
						</CardDescription>
					</CardHeader>
				</Card>
			)}

			{progress.ratingOpen &&
				!progress.isModerator &&
				!progress.isParticipant && (
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Votación en curso</CardTitle>
							<CardDescription>
								Los participantes votan de forma anónima. El resultado aparece
								al cerrar.
							</CardDescription>
						</CardHeader>
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
									1–5 estrellas · anónimo · puedes cambiarlo
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-wrap gap-2">
								{[1, 2, 3, 4, 5].map((n) => (
									<Button
										key={n}
										variant={progress.myStars === n ? "default" : "outline"}
										size="lg"
										disabled={pending}
										aria-pressed={progress.myStars === n}
										aria-label={`Calificar con ${n} ${n === 1 ? "estrella" : "estrellas"}`}
										onClick={() =>
											run(castVoteAction, {
												session_id: progress.sessionId,
												stars: String(n),
											})
										}
									>
										<span>{n}</span>
										<HugeiconsIcon
											icon={StarIcon}
											data-icon="inline-start"
											aria-hidden="true"
										/>
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
