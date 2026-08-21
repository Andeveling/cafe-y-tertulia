import { notFound, redirect } from "next/navigation";
import { getLobbySnapshot } from "@/app/materials/_lib/lobby";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Lobby · Café y Tertulia" };

/** /lobby redirige a /room (ticket #29 — Sala v1 ruta única). */
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

	// Verificar que la sesión existe antes de redirigir.
	const lobby = await getLobbySnapshot(supabase, sessionId);
	if (!lobby) notFound();

	redirect(`/materials/sessions/${sessionId}/room`);
}
