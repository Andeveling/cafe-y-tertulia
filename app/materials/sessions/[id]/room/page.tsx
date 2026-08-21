import { notFound, redirect } from "next/navigation";
import { RoomPanel } from "@/app/materials/_components/room-panel";
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

	if (snapshot.status !== "lobby") {
		return (
			<main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
				<p className="text-sm text-muted-foreground">
					Esta sesión no está en lobby.
				</p>
			</main>
		);
	}

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
			/>
		</main>
	);
}
