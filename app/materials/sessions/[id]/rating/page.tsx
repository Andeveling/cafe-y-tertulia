import { notFound, redirect } from "next/navigation";
import { getRatingProgress } from "@/app/materials/_lib/rating";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Rating · Café y Tertulias" };

/** /rating redirige a /room (ticket #32 — Cierre dentro de la Sala). */
export default async function RatingPage({
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
	const progress = await getRatingProgress(supabase, sessionId);
	if (!progress) notFound();

	redirect(`/materials/sessions/${sessionId}/room`);
}
