import {
	Award01Icon,
	Book02Icon,
	ChampionIcon,
	Chat01Icon,
	Compass01Icon,
	Medal01Icon,
	PuzzleIcon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const MILESTONE_ICONS: Record<string, typeof Award01Icon> = {
	first_book_finished: Book02Icon,
	fifty_sessions: Award01Icon,
	hundred_questions: ChampionIcon,
	mesa_llena: UserGroupIcon,
	triviantes: PuzzleIcon,
	debate_intenso: Chat01Icon,
	exploradores: Compass01Icon,
	club_de_plata: Medal01Icon,
};

export type ClubMilestone = {
	id: string;
	name: string;
	badge_key: string;
	created_at: string;
};

function formatMilestoneDate(iso: string) {
	return new Date(iso).toLocaleDateString("es", {
		month: "short",
		day: "numeric",
	});
}

/**
 * Hitos del club en el detalle del material.
 * Sigue la remodelación de la vitrina del perfil: icono dibujado
 * (Hugeicons, sin emoji), misma paleta Lounge y fecha de logro.
 */
export function ClubMilestones({
	milestones,
}: {
	milestones: ClubMilestone[];
}) {
	if (milestones.length === 0) return null;

	return (
		<section
			aria-labelledby="hitos-club-heading"
			className="rounded-2xl border border-border bg-card p-5"
		>
			<h2
				id="hitos-club-heading"
				className="font-heading text-lg text-foreground"
			>
				Hitos del club
			</h2>
			<p className="mt-1 text-sm text-muted-foreground">
				Logros que el club consiguió como grupo.
			</p>
			<ul className="mt-3 flex flex-wrap gap-2">
				{milestones.map((m) => {
					const icon = MILESTONE_ICONS[m.badge_key] ?? Award01Icon;
					const dateLabel = formatMilestoneDate(m.created_at);
					return (
						<li
							key={m.id}
							title={`${m.name}, ${dateLabel}`}
							className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 py-1.5 pr-3 pl-2.5 text-sm text-foreground"
						>
							<HugeiconsIcon
								icon={icon}
								size={16}
								className="shrink-0 text-primary"
								aria-hidden="true"
							/>
							<span>{m.name}</span>
							<time
								dateTime={m.created_at}
								className="text-xs text-muted-foreground tabular-nums"
							>
								{dateLabel}
							</time>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
