import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LobbyPanel } from "@/app/materials/_components/lobby-panel";
import { getLobbySnapshot } from "@/app/materials/_lib/lobby";
import { SESSION_STATUS_LABELS } from "@/app/materials/_lib/materials";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Lobby · Café y Tertulia" };

export default async function LobbyPage({
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

	const lobby = await getLobbySnapshot(supabase, sessionId);
	if (!lobby) notFound();

	return (
		<main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
			<Button
				variant="ghost"
				size="sm"
				nativeButton={false}
				render={<Link href={`/materials/${lobby.materialId}`} />}
				className="w-fit"
			>
				<HugeiconsIcon icon={ArrowLeftIcon} data-icon="inline-start" />
				Material
			</Button>

			<header className="flex flex-col gap-2">
				<div className="flex flex-wrap gap-2">
					<Badge variant="secondary">Lobby</Badge>
					<Badge variant="outline">{SESSION_STATUS_LABELS[lobby.status]}</Badge>
				</div>
				<h1 className="font-heading text-2xl font-semibold">{lobby.range}</h1>
			</header>

			{lobby.status !== "lobby" ? (
				<p className="text-sm text-muted-foreground">
					Esta sesión no está en lobby.
				</p>
			) : (
				<LobbyPanel
					lobby={lobby}
					userId={user.id}
					isModerator={lobby.moderatorId === user.id}
				/>
			)}
		</main>
	);
}
