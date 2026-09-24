import { notFound, redirect } from "next/navigation";
import { getRoomSnapshot } from "@/app/materials/_lib/room";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Lobby · Café y Tertulias" };

/** /lobby redirige a /room (ticket #44 — Presentes y Sorteo viven en la Sala). */
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

	// La Sala es la única fuente (getRoomSnapshot, 1 RPC): aquí solo existe.
	const snapshot = await getRoomSnapshot(supabase, sessionId);
	if (!snapshot) notFound();

	redirect(`/materials/sessions/${sessionId}/room`);
}
