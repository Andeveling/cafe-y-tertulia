import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RatingPanel } from "@/app/materials/_components/rating-panel";
import { getRatingProgress } from "@/app/materials/_lib/rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Rating · Café y Tertulia" };

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

	const progress = await getRatingProgress(supabase, sessionId);
	if (!progress) notFound();

	const { data: session } = await supabase
		.from("sessions")
		.select("range")
		.eq("id", sessionId)
		.maybeSingle();

	return (
		<main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<Button
					variant="ghost"
					size="sm"
					render={<Link href={`/materials/${progress.materialId}`} />}
					className="w-fit"
				>
					<HugeiconsIcon icon={ArrowLeftIcon} data-icon="inline-start" />
					Material
				</Button>
				<div className="flex gap-2">
					<Badge variant="secondary">Rating</Badge>
					{session && <Badge variant="outline">{session.range}</Badge>}
				</div>
			</div>
			<p className="text-sm text-muted-foreground">
				Solo en tu dispositivo · no va a la pantalla compartida
			</p>
			<RatingPanel progress={progress} />
		</main>
	);
}
