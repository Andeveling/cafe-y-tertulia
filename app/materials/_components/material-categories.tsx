"use client";

import {
	ClapperboardIcon,
	FeatherIcon,
	Idea01Icon,
	LandmarkIcon,
	NewspaperIcon,
	Tag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Category } from "@/app/materials/_lib/categories";
import { setMaterialCategories } from "@/app/materials/_lib/category-actions";
import { MasteryStrip } from "@/components/mastery-strip";
import { Badge } from "@/components/ui/badge";

const CATEGORY_ICON: Record<string, typeof Idea01Icon> = {
	filosofia: Idea01Icon,
	cine: ClapperboardIcon,
	actualidad: NewspaperIcon,
	poesia: FeatherIcon,
	historia: LandmarkIcon,
};

type Props = {
	materialId: string;
	all: Category[];
	initialIds: string[];
	/** Tira de maestría del lector en las categorías del material. */
	mastery: { categoryId: string; categoryName: string; level: string }[];
	canEdit: boolean;
};

/**
 * Categorías del material (variante A del prototipo): chips con icono para
 * ver y —si eres Miembro— tocar. Arriba la tira de tu maestría.
 */
export function MaterialCategories({
	materialId,
	all,
	initialIds,
	mastery,
	canEdit,
}: Props) {
	const [picked, setPicked] = useState<string[]>(initialIds);
	const [pending, startTransition] = useTransition();

	const toggle = (id: string) => {
		if (!canEdit || pending) return;
		const next = picked.includes(id)
			? picked.filter((c) => c !== id)
			: [...picked, id];
		setPicked(next);
		startTransition(async () => {
			const result = await setMaterialCategories(materialId, next);
			if (!result.ok) {
				setPicked(picked);
				toast.error(result.error);
			}
		});
	};

	return (
		<div className="flex flex-col gap-3">
			<MasteryStrip items={mastery} />
			<div
				className="flex flex-wrap gap-2"
				role="group"
				aria-label="Categorías del material"
			>
				{all.map((c) => {
					const on = picked.includes(c.id);
					const chip = (
						<Badge variant={on ? "default" : "outline"}>
							<HugeiconsIcon
								icon={CATEGORY_ICON[c.key] ?? Tag01Icon}
								size={14}
								data-icon="inline-start"
							/>{" "}
							{c.name}
						</Badge>
					);
					if (!canEdit) return <span key={c.id}>{chip}</span>;
					return (
						<button
							key={c.id}
							type="button"
							onClick={() => toggle(c.id)}
							aria-pressed={on}
							disabled={pending}
						>
							{chip}
						</button>
					);
				})}
			</div>
		</div>
	);
}
