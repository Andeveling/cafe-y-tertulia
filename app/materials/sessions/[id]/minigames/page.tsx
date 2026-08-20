import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MinigamesPanel } from "@/app/materials/_components/minigames-panel";
import {
	getMinigameState,
	getTriviaRoundSnapshot,
} from "@/app/materials/_lib/minigames";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Minijuegos · Café y Tertulia" };

export default async function MinigamesPage({
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

	const { data: session } = await supabase
		.from("sessions")
		.select("id, material_id, range, status, moderator_id")
		.eq("id", sessionId)
		.maybeSingle();
	if (!session) notFound();

	const state = await getMinigameState(supabase, sessionId);
	if (!state) notFound();

	const roundId = state.liveRoundId ?? state.lastBoardRoundId;
	const round = roundId
		? await getTriviaRoundSnapshot(supabase, roundId)
		: null;

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<Button
					variant="ghost"
					size="sm"
					nativeButton={false}
					render={<Link href={`/materials/${session.material_id}`} />}
					className="w-fit"
				>
					<HugeiconsIcon icon={ArrowLeftIcon} data-icon="inline-start" />
					Material
				</Button>
				<div className="flex gap-2">
					<Badge variant="secondary">Minijuegos</Badge>
					<Badge variant="outline">{session.range}</Badge>
					{session.status === "in_progress" && (
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={<Link href={`/materials/sessions/${sessionId}/stage`} />}
						>
							Escenario
						</Button>
					)}
				</div>
			</div>

			{session.status !== "in_progress" ? (
				<p className="text-sm text-muted-foreground text-center py-16">
					Los minijuegos se juegan con la sesión en curso.
				</p>
			) : (
				<MinigamesPanel
					sessionId={sessionId}
					state={state}
					round={round}
					isModerator={session.moderator_id === user.id}
				/>
			)}
		</main>
	);
}
