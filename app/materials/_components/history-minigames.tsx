import {
	GameController01Icon,
	NeutralIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SessionHistory } from "@/app/materials/_lib/materials";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type TriviaRound = SessionHistory["trivia_rounds"][number];
type Take = SessionHistory["takes"][number];

/**
 * Resultados de minijuegos (Trivia + Takes) en el Histórico.
 * Trivia: scoreboard agregado por ronda. Takes: conteo de posturas.
 */
export function HistoryMinigames({
	triviaRounds,
	takes,
}: {
	triviaRounds: TriviaRound[];
	takes: Take[];
}) {
	if (triviaRounds.length === 0 && takes.length === 0) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<HugeiconsIcon
						icon={GameController01Icon}
						className="size-4 text-muted-foreground"
					/>
					Minijuegos
				</CardTitle>
				<CardDescription>Trivias y Takes de esta sesión</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{triviaRounds.map((round) => (
					<TriviaRoundCard key={round.id} round={round} />
				))}
				{takes.map((take) => (
					<TakeCard key={take.id} take={take} />
				))}
			</CardContent>
		</Card>
	);
}

function TriviaRoundCard({ round }: { round: TriviaRound }) {
	const sorted = [...round.items].sort((a, b) => b.hits - a.hits);
	const maxHits = sorted[0]?.hits ?? 0;

	return (
		<div className="rounded-lg border p-4">
			<div className="flex items-center justify-between mb-3">
				<h4 className="font-medium">{round.title}</h4>
				<Badge variant="outline">{round.items.length} participantes</Badge>
			</div>
			{sorted.length === 0 ? (
				<p className="text-sm text-muted-foreground">Sin resultados.</p>
			) : (
				<ul className="flex flex-col gap-2">
					{sorted.map((item, i) => (
						<li
							key={item.member_id}
							className="flex items-center justify-between gap-2"
						>
							<span className="flex items-center gap-2 min-w-0">
								<span className="text-xs text-muted-foreground w-5 text-right">
									{i + 1}.
								</span>
								<span className="truncate">{item.display_name}</span>
								{item.hits === maxHits && maxHits > 0 && (
									<Badge variant="secondary" className="text-xs">
										🏆
									</Badge>
								)}
							</span>
							<span className="text-sm font-medium tabular-nums">
								{item.hits} {item.hits === 1 ? "acuerdo" : "aciertos"}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function TakeCard({ take }: { take: Take }) {
	const total = take.counts.agree + take.counts.disagree + take.counts.neutral;

	return (
		<div className="rounded-lg border p-4">
			<div className="flex items-center justify-between mb-3">
				<h4 className="font-medium">{take.prompt}</h4>
				<Badge variant="outline">
					{total} {total === 1 ? "voto" : "votos"}
				</Badge>
			</div>
			<div className="flex gap-4 text-sm">
				<span className="inline-flex items-center gap-1.5">
					<HugeiconsIcon
						icon={ThumbsUpIcon}
						className="size-4 text-green-600"
					/>
					{take.counts.agree}
				</span>
				<span className="inline-flex items-center gap-1.5">
					<HugeiconsIcon
						icon={ThumbsDownIcon}
						className="size-4 text-red-600"
					/>
					{take.counts.disagree}
				</span>
				<span className="inline-flex items-center gap-1.5">
					<HugeiconsIcon
						icon={NeutralIcon}
						className="size-4 text-muted-foreground"
					/>
					{take.counts.neutral}
				</span>
			</div>
		</div>
	);
}
