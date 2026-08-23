import { notFound, redirect } from "next/navigation";
import { getStageSnapshot } from "@/app/materials/_lib/stage";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Escenario · Café y Tertulia" };

/** /stage redirige a /room (ticket #30 — Debate dentro de la Sala). */
export default async function StagePage({
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
	const stage = await getStageSnapshot(supabase, sessionId);
	if (!stage) notFound();

	redirect(`/materials/sessions/${sessionId}/room`);
}
