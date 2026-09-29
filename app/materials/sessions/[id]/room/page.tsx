import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { RoomSessionView } from "@/app/materials/_components/room-session-view";
import {
	getMinigameState,
	getTriviaRoundSnapshot,
} from "@/app/materials/_lib/minigames";
import { getRatingProgress } from "@/app/materials/_lib/rating";
import { getRoomSnapshot } from "@/app/materials/_lib/room";
import {
	getPendingConvocatoriaIds,
	getRoomRosterMembers,
} from "@/app/materials/_lib/room-roster";
import {
	claimModeratorIfAbsent,
	seatIfAbsent,
} from "@/app/materials/_lib/room-seat";
import {
	LEFT_ROOM_COOKIE,
	shouldClaimModerator,
	shouldSeatOnRoomLoad,
} from "@/app/materials/_lib/room-seat-gate";
import { roomSurface } from "@/app/materials/_lib/room-sync";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sala · Café y Tertulias" };
export const dynamic = "force-dynamic";

export default async function RoomPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: sessionId } = await params;
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/auth/login");

	let snapshot = await getRoomSnapshot(supabase, sessionId);
	if (!snapshot) notFound();

	// Preguntas cuenta a quien tiene la Sala abierta. Sin asiento, la
	// mesa vacía se leía como "todos tienen pregunta". Un refresh justo
	// después de Salir no cuenta: volvería a sentar a quien se fue.
	const leftMarker = (await cookies()).get(LEFT_ROOM_COOKIE)?.value ?? null;
	const alreadySeated = snapshot.participants.some(
		(p) => p.memberId === user.id,
	);
	const seatOnLoad = shouldSeatOnRoomLoad({
		status: snapshot.status,
		roomStage: snapshot.roomStage,
		seated: alreadySeated,
		leftMarker,
		sessionId,
	});
	let seated = alreadySeated;
	if (seatOnLoad) {
		const seat = await seatIfAbsent(supabase, sessionId, user.id);
		// Sin error: fila nueva o ya estaba. Las dos cuentan como sentado.
		if (!seat.error) seated = true;
	}
	const claim = shouldClaimModerator({
		status: snapshot.status,
		roomStage: snapshot.roomStage,
		seated,
		moderatorId: snapshot.moderatorId,
	});
	if (claim) await claimModeratorIfAbsent(supabase, sessionId, user.id);
	if (seatOnLoad || claim) {
		const next = await getRoomSnapshot(supabase, sessionId);
		if (next) snapshot = next;
	}

	const isModerator = snapshot.moderatorId === user.id;
	const [rosterMembers, pendingIds] = isModerator
		? await Promise.all([
				getRoomRosterMembers(supabase).catch(() => []),
				getPendingConvocatoriaIds(supabase, sessionId).catch(
					() => [] as string[],
				),
			])
		: [[], [] as string[]];

	const surface = roomSurface(snapshot.status);
	const rating =
		surface === "closed" ||
		snapshot.roomStage === "cierre" ||
		snapshot.roomStage === "debate"
			? await getRatingProgress(supabase, sessionId).catch(() => null)
			: null;

	const minigameState =
		surface === "open" && snapshot.roomStage === "debate"
			? await getMinigameState(supabase, sessionId).catch(() => null)
			: null;
	const roundId =
		minigameState?.liveRoundId ?? minigameState?.lastBoardRoundId ?? null;
	const round = roundId
		? await getTriviaRoundSnapshot(supabase, roundId).catch(() => null)
		: null;

	return (
		<RoomSessionView
			snapshot={snapshot}
			rating={rating}
			userId={user.id}
			minigameState={minigameState}
			round={round}
			rosterMembers={rosterMembers}
			pendingIds={pendingIds}
		/>
	);
}
