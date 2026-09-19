import { TrophyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import type { SessionHistory } from "@/app/materials/_lib/materials";
import { getBadgeIcon } from "@/components/badge-icons";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type Award = SessionHistory["awards"][number];

/**
 * Logros otorgados en una sesión del Histórico.
 * Muestra insignias individuales y colectivas con su contexto.
 */
export function HistoryAwards({ awards }: { awards: Award[] }) {
	if (awards.length === 0) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<HugeiconsIcon
						icon={TrophyIcon}
						className="size-4 text-muted-foreground"
					/>
					Logros
				</CardTitle>
				<CardDescription>Insignias otorgadas en esta sesión</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-col gap-2">
					{awards.map((award) => (
						<li
							key={award.id}
							className="flex items-center gap-3 rounded-lg border p-3"
						>
							<span
								className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card/60 text-primary"
								aria-hidden="true"
							>
								<HugeiconsIcon icon={getBadgeIcon(award.badge_key)} size={20} />
							</span>
							<div className="flex flex-col gap-0.5 min-w-0 flex-1">
								<span className="text-sm font-medium">{award.name}</span>
								{award.member_id ? (
									<Link
										href={`/members/${award.member_id}`}
										className="text-xs text-muted-foreground hover:underline"
									>
										{award.display_name ?? "Miembro del club"}
									</Link>
								) : (
									<span className="text-xs text-muted-foreground">
										Logro del club
									</span>
								)}
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
