"use client";

import { DrawCeremonyView } from "@/app/materials/_components/draw-ceremony-view";
import { useDrawClock } from "@/app/materials/_hooks/use-draw-clock";
import type { DrawCeremonySlice } from "@/app/materials/_lib/draw-ceremony";
import type { RoomReadiness } from "@/app/materials/_lib/room-types";

type Props = {
	snapshot: DrawCeremonySlice & {
		sessionId: string;
		readiness: RoomReadiness;
		asOf?: number;
	};
	userId: string;
	isModerator: boolean;
	pending?: boolean;
	onExecute?: () => void;
};

/**
 * Adaptador de la ceremonia en la Sala: posee el reloj realtime y pasa
 * el slice + Sortear a la vista. La Sala no calcula flags ni el filtro
 * de Espectador.
 */
export function DrawCeremony({
	snapshot,
	userId,
	isModerator,
	pending,
	onExecute,
}: Props) {
	const eventT0 = useDrawClock(
		snapshot.sessionId,
		snapshot.draw.createdAt,
		!snapshot.draw.done,
	);
	return (
		<DrawCeremonyView
			snapshot={snapshot}
			userId={userId}
			isModerator={isModerator}
			pending={pending}
			onExecute={onExecute}
			optimisticCreatedAt={eventT0}
		/>
	);
}
