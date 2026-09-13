import { notFound, redirect } from "next/navigation";
import { RoomSessionView } from "@/app/materials/_components/room-session-view";
import {
	getMinigameState,
	getTriviaRoundSnapshot,
} from "@/app/materials/_lib/minigames";
import { getRatingProgress } from "@/app/materials/_lib/rating";
import { getRoomSnapshot } from "@/app/materials/_lib/room";
import { roomSurface } from "@/app/materials/_lib/room-sync";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sala · Café y Tertulia" };
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

	const snapshot = await getRoomSnapshot(supabase, sessionId);
	if (!snapshot) notFound();

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
		/>
	);
}
