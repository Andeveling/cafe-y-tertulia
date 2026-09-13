"use client";

import { AdvanceButton } from "@/app/materials/_components/advance-button";
import { RoomClosedView } from "@/app/materials/_components/room-closed-view";
import { RoomPanel } from "@/app/materials/_components/room-panel";
import { useLatestSnapshot } from "@/app/materials/_hooks/use-room-realtime";
import type {
	MinigameState,
	TriviaRoundSnapshot,
} from "@/app/materials/_lib/minigames";
import type { RatingProgress } from "@/app/materials/_lib/rating";
import { roomSurface } from "@/app/materials/_lib/room-sync";
import type { RoomSnapshot } from "@/app/materials/_lib/room-types";
import { Badge } from "@/components/ui/badge";

type Props = {
	snapshot: RoomSnapshot;
	rating: RatingProgress | null;
	userId: string;
	minigameState?: MinigameState | null;
	round?: TriviaRoundSnapshot | null;
};

/**
 * Rama lobby / Cierre / inactiva detrás del mismo apply-latest que la Sala.
 * Un RSC más lento empezado antes de closeSession no puede remountar la Sala
 * abierta encima de «Sesión finalizada».
 */
export function RoomSessionView({
	snapshot,
	rating,
	userId,
	minigameState = null,
	round = null,
}: Props) {
	const frame = useLatestSnapshot({
		asOf: snapshot.asOf,
		snapshot,
		rating,
		minigameState,
		round,
	});
	const view = frame.snapshot;
	const surface = roomSurface(view.status);

	if (surface === "closed") {
		const moderatorName =
			view.participants.find((p) => p.memberId === view.moderatorId)
				?.displayName ?? null;
		return (
			<RoomClosedView
				materialId={view.materialId}
				sessionId={view.sessionId}
				isModerator={view.moderatorId === userId}
				status={view.status === "archived" ? "archived" : "closed"}
				range={view.range}
				moderatorName={moderatorName}
				participantsCount={view.participants.length}
				questionsCount={view.questions.length}
				rating={
					frame.rating
						? { avg: frame.rating.ratingAvg, count: frame.rating.ratingCount }
						: null
				}
			/>
		);
	}

	if (surface === "inactive") {
		if (view.status !== "preparation") {
			return (
				<main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
					<p className="text-sm text-muted-foreground">
						Esta sesión no está activa.
					</p>
				</main>
			);
		}
		return (
			<main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
				<h1 className="font-heading text-2xl font-semibold">
					{view.range || "Sesión"}
				</h1>
				<p className="text-sm text-muted-foreground">
					La sala se abre para reunir al grupo antes de empezar la tertulia.
				</p>
				<div>
					<AdvanceButton
						kind="session"
						id={view.sessionId}
						materialId={view.materialId}
						status={view.status}
					/>
				</div>
			</main>
		);
	}

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-6 md:max-w-4xl md:px-8 md:py-8 lg:max-w-5xl lg:py-10">
			<header className="flex flex-col gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline">Sala</Badge>
					{view.status === "lobby" && (
						<AdvanceButton
							kind="session"
							id={view.sessionId}
							materialId={view.materialId}
							status={view.status}
						/>
					)}
				</div>
				<h1 className="font-heading text-2xl font-semibold">
					{view.range || "Sesión"}
				</h1>
			</header>

			<RoomPanel
				snapshot={view}
				userId={userId}
				isModerator={view.moderatorId === userId}
				rating={frame.rating}
				minigameState={frame.minigameState ?? null}
				round={frame.round ?? null}
			/>
		</main>
	);
}
