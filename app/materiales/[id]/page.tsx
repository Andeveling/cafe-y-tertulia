import { notFound } from "next/navigation";
import { MaterialQuestionsSection } from "@/components/questions/material-questions-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type MaterialPageProps = {
	params: Promise<{ id: string }>;
};

const kindLabels: Record<string, string> = {
	book: "Libro",
	podcast: "Podcast",
	video: "Video",
	article: "Artículo",
};

const statusLabels: Record<string, string> = {
	proposed: "Propuesto",
	selected: "Seleccionado",
	in_progress: "En curso",
	finished: "Terminado",
};

export default async function MaterialPage({ params }: MaterialPageProps) {
	const { id } = await params;
	const supabase = await createClient();

	const { data: material, error } = await supabase
		.from("materials")
		.select("*")
		.eq("id", id)
		.maybeSingle();

	if (error || !material) {
		notFound();
	}

	const { data: sessions } = await supabase
		.from("sessions")
		.select("id, range, status, moderator_id")
		.eq("material_id", id)
		.order("created_at", { ascending: true });

	const preparationSessions = (sessions ?? []).filter(
		(session) => session.status === "preparation",
	);

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<CardTitle>{material.title}</CardTitle>
						<Badge variant="secondary">{statusLabels[material.status]}</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						{kindLabels[material.kind]} · {material.author}
					</p>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<h2 className="text-sm font-medium">Sesiones</h2>
					{preparationSessions.length === 0 && (
						<p className="text-sm text-muted-foreground">
							Aún no hay Sesiones en preparación.
						</p>
					)}
					{preparationSessions.map((session) => (
						<section key={session.id} className="flex flex-col gap-4">
							<MaterialQuestionsSection
								materialId={material.id}
								sessionId={session.id}
								sessionRange={session.range}
							/>
						</section>
					))}
				</CardContent>
			</Card>
		</main>
	);
}
