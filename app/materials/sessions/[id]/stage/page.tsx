import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RatingDisplay } from "@/app/materials/_components/rating-display";
import { StagePanel } from "@/app/materials/_components/stage-panel";
import { getStageSnapshot } from "@/app/materials/_lib/stage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Escenario · Café y Tertulia" };

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

	const stage = await getStageSnapshot(supabase, sessionId);
	if (!stage) notFound();

	const { data: ratingRow } = await supabase
		.from("sessions")
		.select("rating_avg, rating_count, rating_open")
		.eq("id", sessionId)
		.maybeSingle();
	const frozenRating =
		ratingRow && ratingRow.rating_count > 0 && !ratingRow.rating_open
			? { avg: ratingRow.rating_avg, count: ratingRow.rating_count }
			: null;

	return (
		<main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col gap-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<Button
					variant="ghost"
					size="sm"
					nativeButton={false}
					render={<Link href={`/materials/${stage.materialId}`} />}
					className="w-fit"
				>
					<HugeiconsIcon icon={ArrowLeftIcon} data-icon="inline-start" />
					Material
				</Button>
				<div className="flex gap-2 items-center">
					<Badge variant="secondary">Escenario</Badge>
					<Badge variant="outline">{stage.range}</Badge>
					<Button
						variant="outline"
						size="sm"
						nativeButton={false}
						render={<Link href={`/materials/sessions/${sessionId}/rating`} />}
					>
						Rating
					</Button>
				</div>
			</div>

			{frozenRating && (
				<Card>
					<CardHeader>
						<CardTitle>Rating congelado</CardTitle>
						<CardDescription>
							Votos descartados · hasta cerrar la sesión
						</CardDescription>
					</CardHeader>
					<CardContent>
						<RatingDisplay
							value={frozenRating.avg}
							count={frozenRating.count}
							size="lg"
						/>
					</CardContent>
				</Card>
			)}

			{stage.status !== "in_progress" ? (
				<p className="text-sm text-muted-foreground text-center py-16">
					El escenario se usa cuando la sesión está en curso.
				</p>
			) : (
				<StagePanel
					stage={stage}
					userId={user.id}
					isModerator={stage.moderatorId === user.id}
				/>
			)}
		</main>
	);
}
