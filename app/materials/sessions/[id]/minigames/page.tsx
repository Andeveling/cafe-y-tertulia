import { notFound, redirect } from "next/navigation";
import { getRoomSnapshot } from "@/app/materials/_lib/room";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Minijuegos · Café y Tertulia" };

/** /minigames redirige a la Sala (ticket #31 — bandeja del Debate). */
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

	// Verificar que la sesión existe antes de redirigir.
	const snapshot = await getRoomSnapshot(supabase, sessionId);
	if (!snapshot) notFound();

	redirect(`/materials/sessions/${sessionId}/room`);
}
