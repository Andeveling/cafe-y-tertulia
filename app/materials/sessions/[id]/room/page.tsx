import { notFound, redirect } from "next/navigation";
import { RoomClosedView } from "@/app/materials/_components/room-closed-view";
import { RoomPanel } from "@/app/materials/_components/room-panel";
import { getRatingProgress } from "@/app/materials/_lib/rating";
import { getRoomSnapshot } from "@/app/materials/_lib/room";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sala · Café y Tertulia" };

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

	// La Sala vive en lobby (preguntas/presentes/sorteo) e in_progress (debate
	// y cierre); cualquier otro estado técnico (preparation, closed, archived)
	// no tiene Sala activa.
	if (snapshot.status !== "lobby" && snapshot.status !== "in_progress") {
		if (snapshot.status === "closed" || snapshot.status === "archived") {
			return (
				<RoomClosedView
					materialId={snapshot.materialId}
					status={snapshot.status}
				/>
			);
		}
		return (
			<main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
				<p className="text-sm text-muted-foreground">
					Esta sesión no está activa.
				</p>
			</main>
		);
	}

	// En Cierre la Sala también muestra la votación del rating.
	const rating =
		snapshot.roomStage === "cierre"
			? await getRatingProgress(supabase, sessionId)
			: null;

	return (
		<main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
			<header className="flex flex-col gap-2">
				<div className="flex flex-wrap gap-2">
					<Badge variant="outline">Sala</Badge>
				</div>
				<h1 className="font-heading text-2xl font-semibold">
					{snapshot.range}
				</h1>
			</header>

			<RoomPanel
				snapshot={snapshot}
				userId={user.id}
				isModerator={snapshot.moderatorId === user.id}
				rating={rating}
			/>
		</main>
	);
}
