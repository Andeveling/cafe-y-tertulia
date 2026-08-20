import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StagePanel } from "@/app/materials/_components/stage-panel";
import { getStageSnapshot } from "@/app/materials/_lib/stage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

	return (
		<main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col gap-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<Button
					variant="ghost"
					size="sm"
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
						render={<Link href={`/materials/sessions/${sessionId}/rating`} />}
					>
						Rating
					</Button>
				</div>
			</div>

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
