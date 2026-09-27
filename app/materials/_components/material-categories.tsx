import {
	ClapperboardIcon,
	FeatherIcon,
	HealthIcon,
	Idea01Icon,
	LandmarkIcon,
	NewspaperIcon,
	Rocket01Icon,
	SparklesIcon,
	Tag01Icon,
	Target02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Category } from "@/app/materials/_lib/categories";
import { MasteryStrip } from "@/components/mastery-strip";
import { Badge } from "@/components/ui/badge";

const CATEGORY_ICON: Record<string, typeof Idea01Icon> = {
	filosofia: Idea01Icon,
	cine: ClapperboardIcon,
	actualidad: NewspaperIcon,
	poesia: FeatherIcon,
	historia: LandmarkIcon,
	"desarrollo-personal": SparklesIcon,
	"habitos-productividad": Target02Icon,
	"salud-bienestar": HealthIcon,
	emprendimiento: Rocket01Icon,
};

type Props = {
	/** Categorías asignadas al crear el material. Solo lectura. */
	categories: Category[];
	/** Tira de maestría del lector en las categorías del material. */
	mastery: { categoryId: string; categoryName: string; level: string }[];
};

/**
 * Categorías del material en solo lectura: el material ya creado no se
 * re-etiqueta desde aquí porque sus categorías alimentan maestrías.
 */
export function MaterialCategories({ categories, mastery }: Props) {
	return (
		<div className="flex flex-col gap-3">
			<MasteryStrip items={mastery} />
			<div
				className="flex flex-wrap gap-2"
				role="group"
				aria-label="Categorías del material"
			>
				{categories.map((c) => (
					<Badge key={c.id} variant="default">
						<HugeiconsIcon
							icon={CATEGORY_ICON[c.key] ?? Tag01Icon}
							size={14}
							data-icon="inline-start"
						/>{" "}
						{c.name}
					</Badge>
				))}
			</div>
		</div>
	);
}
