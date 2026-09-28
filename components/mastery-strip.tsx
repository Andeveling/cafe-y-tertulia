"use client";

import {
	Chat01Icon,
	Coffee01Icon,
	LaurelWreath01Icon,
	SproutIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { MASTERY_LEVELS, masteryProgress } from "@/app/materials/_lib/mastery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type MasteryStripItem = {
	categoryId: string;
	categoryName: string;
	level: string;
	points?: number;
};

/** Punto de vista del lector: propio perfil (tuteo) u otro miembro. */
export type MasteryPerspective = "own" | "other";

const LEVEL_ICON: Record<string, typeof SproutIcon> = {
	Semilla: SproutIcon,
	Degustador: Coffee01Icon,
	Contertulio: Chat01Icon,
	Maestro: LaurelWreath01Icon,
};

/** En perfil se resumen: el resto vive tras "Ver todas". */
const TOP_N = 5;

function pointsLabel(points: number) {
	return `${points} ${points === 1 ? "punto" : "puntos"}`;
}

/** Una maestría con avance: icono de nivel + categoría + barra al siguiente. */
function MasteryRow({ item }: { item: MasteryStripItem }) {
	const points = item.points ?? 0;
	const progress = masteryProgress(points);
	const index = MASTERY_LEVELS.findIndex((s) => s.name === progress.level);
	const nextStep =
		progress.next === null ? null : (MASTERY_LEVELS[index + 1] ?? null);
	const toGo = nextStep ? nextStep.min - points : 0;

	return (
		<li className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
			<span
				aria-hidden="true"
				className="grid size-10 shrink-0 place-items-center rounded-lg border border-border/60 bg-card text-primary"
			>
				<HugeiconsIcon icon={LEVEL_ICON[item.level] ?? SproutIcon} size={20} />
			</span>
			<div className="min-w-0 flex-1">
				<div className="flex items-baseline justify-between gap-2">
					<p className="truncate text-sm font-semibold text-foreground">
						{item.categoryName}
					</p>
					<p className="shrink-0 text-label-sm text-muted-foreground tabular-nums">
						{item.level} · {pointsLabel(points)}
					</p>
				</div>
				<Progress
					value={progress.pct}
					aria-label={
						nextStep
							? `${item.categoryName}: ${pointsLabel(points)} hacia ${nextStep.name}`
							: `${item.categoryName}: ${item.level}, tope de la escala`
					}
					className="mt-2 [&_[data-slot='progress-track']]:h-1.5"
				/>
				<p className="mt-1.5 text-xs text-muted-foreground">
					{nextStep ? (
						<>
							Te{" "}
							{toGo === 1 ? (
								<>
									falta{" "}
									<span className="font-semibold text-foreground tabular-nums">
										1 punto
									</span>
								</>
							) : (
								<>
									faltan{" "}
									<span className="font-semibold text-foreground tabular-nums">
										{toGo} puntos
									</span>
								</>
							)}{" "}
							para {nextStep.name}
						</>
					) : (
						<>Tope de la escala · Maestro</>
					)}
				</p>
			</div>
		</li>
	);
}

/**
 * Maestrías con avance (puntos > 0), ordenadas por puntos.
 * Las Semilla sin puntos se resumen en una línea; sin avance → empty motivador.
 * Sin puntos (ficha de material) → pills compactas de solo lectura.
 */
export function MasteryStrip({
	items,
	perspective = "own",
}: {
	items: MasteryStripItem[];
	perspective?: MasteryPerspective;
}) {
	const [expanded, setExpanded] = useState(false);
	if (items.length === 0) return null;

	if (items.every((m) => m.points === undefined)) {
		return (
			<ul aria-label="Maestrías" className="flex flex-wrap gap-2">
				{items.map((m) => (
					<li key={m.categoryId}>
						<Badge variant="secondary" className="py-1.5 text-sm">
							<HugeiconsIcon
								icon={LEVEL_ICON[m.level] ?? SproutIcon}
								size={18}
								data-icon="inline-start"
							/>{" "}
							{m.categoryName} · {m.level}
						</Badge>
					</li>
				))}
			</ul>
		);
	}

	const active = items.filter((m) => (m.points ?? 0) > 0);
	const dormantCount = items.length - active.length;

	if (active.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				{perspective === "own"
					? "Aún sin maestrías con puntos. Participa y aporta en una sesión para subir a Degustador (3 pts)."
					: "Aún sin maestrías con puntos."}
			</p>
		);
	}

	const visible = expanded ? active : active.slice(0, TOP_N);

	return (
		<div className="flex flex-col gap-3">
			<ul
				aria-label="Maestrías con avance"
				className={
					active.length >= 4
						? "grid grid-cols-1 gap-3 sm:grid-cols-2"
						: "flex flex-col gap-3"
				}
			>
				{visible.map((m) => (
					<MasteryRow key={m.categoryId} item={m} />
				))}
			</ul>
			{dormantCount > 0 && (
				<p className="text-sm text-muted-foreground">
					{perspective === "own"
						? `+${dormantCount} en Semilla · participa para despertarlas.`
						: `+${dormantCount} en Semilla.`}
				</p>
			)}
			{active.length > TOP_N && (
				<Button
					variant="ghost"
					className="self-start px-0"
					aria-expanded={expanded}
					onClick={() => setExpanded((v) => !v)}
				>
					{expanded ? "Ver menos" : `Ver todas (${active.length})`}
				</Button>
			)}
		</div>
	);
}
