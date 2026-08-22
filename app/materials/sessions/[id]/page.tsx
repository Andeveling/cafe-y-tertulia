import { notFound } from "next/navigation";
import { HistoryAwards } from "@/app/materials/_components/history-awards";
import { HistoryMinigames } from "@/app/materials/_components/history-minigames";
import { HistoryParticipants } from "@/app/materials/_components/history-participants";
import { HistoryQuestions } from "@/app/materials/_components/history-questions";
import { RatingDisplay } from "@/app/materials/_components/rating-display";
import {
	getSessionHistory,
	SESSION_STATUS_LABELS,
} from "@/app/materials/_lib/materials";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sesión · Histórico · Café y Tertulia" };

export default async function SessionHistoryPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const supabase = await createClient();
	const session = await getSessionHistory(supabase, (await params).id);
	if (!session) notFound();

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
			<header className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary">Histórico</Badge>
					<Badge variant="outline">
						{SESSION_STATUS_LABELS[session.status]}
					</Badge>
				</div>
				<h1 className="font-heading text-3xl font-semibold">
					{session.material.title}
				</h1>
				<p className="text-muted-foreground">
					{session.range} · {session.material.author}
				</p>
				{session.rating_count > 0 && (
					<p className="flex flex-wrap items-center gap-2 text-sm">
						<span>Rating sesión:</span>
						<RatingDisplay
							value={session.rating_avg}
							count={session.rating_count}
						/>
					</p>
				)}
			</header>

			<HistoryParticipants participants={session.participants} />
			<HistoryQuestions questions={session.questions} />
			<HistoryMinigames
				triviaRounds={session.trivia_rounds}
				takes={session.takes}
			/>
			<HistoryAwards awards={session.awards} />
		</main>
	);
}
