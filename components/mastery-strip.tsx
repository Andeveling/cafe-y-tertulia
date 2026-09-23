import {
	Chat01Icon,
	Coffee01Icon,
	LaurelWreath01Icon,
	SproutIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { masteryProgress } from "@/app/materials/_lib/mastery";
import { Badge } from "@/components/ui/badge";

export type MasteryStripItem = {
	categoryId: string;
	categoryName: string;
	level: string;
	points?: number;
};

const LEVEL_ICON: Record<string, typeof SproutIcon> = {
	Semilla: SproutIcon,
	Degustador: Coffee01Icon,
	Contertulio: Chat01Icon,
	Maestro: LaurelWreath01Icon,
};

/** Tira de maestrías (variante A): medalla a 18px + categoría + nivel. */
export function MasteryStrip({ items }: { items: MasteryStripItem[] }) {
	if (items.length === 0) return null;
	return (
		<div className="flex flex-wrap gap-2" role="group" aria-label="Maestrías">
			{items.map((m) => {
				const progress =
					m.points === undefined ? null : masteryProgress(m.points);
				const title =
					progress === null
						? `${m.categoryName} · ${m.level}`
						: progress.next === null
							? `${m.categoryName} · ${m.level} · ${m.points} pts (tope)`
							: `${m.categoryName} · ${m.level} · ${m.points} pts → ${progress.next}`;
				return (
					<Badge
						key={m.categoryId}
						variant="secondary"
						className="py-1.5 text-sm"
						title={title}
					>
						<HugeiconsIcon
							icon={LEVEL_ICON[m.level] ?? SproutIcon}
							size={18}
							data-icon="inline-start"
						/>{" "}
						{m.categoryName} · {m.level}
					</Badge>
				);
			})}
		</div>
	);
}
