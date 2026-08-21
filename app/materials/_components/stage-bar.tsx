"use client";

import type { RoomStage } from "@/app/materials/_lib/room-types";
import {
	ROOM_STAGE_LABELS,
	ROOM_STAGE_ORDER,
} from "@/app/materials/_lib/room-types";
import { cn } from "@/lib/utils";

type Props = {
	current: RoomStage;
	className?: string;
};

/**
 * Barra de etapas de la Sala: ✓ completada ● actual ○ futura.
 * Preguntas → Presentes → Sorteo.
 */
export function StageBar({ current, className }: Props) {
	const currentIdx = ROOM_STAGE_ORDER.indexOf(current);

	return (
		<nav
			aria-label="Etapas de la Sala"
			className={cn("flex items-center gap-1", className)}
		>
			{ROOM_STAGE_ORDER.map((stage, idx) => {
				const isCompleted = idx < currentIdx;
				const isCurrent = idx === currentIdx;

				return (
					<div key={stage} className="flex items-center gap-1">
						{idx > 0 && (
							<span
								className={cn(
									"h-px w-4 sm:w-6",
									idx <= currentIdx ? "bg-primary" : "bg-muted-foreground/30",
								)}
								aria-hidden="true"
							/>
						)}
						<span
							className={cn(
								"flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
								isCompleted && "bg-primary/10 text-primary",
								isCurrent && "bg-primary text-primary-foreground",
								!isCompleted && !isCurrent && "bg-muted text-muted-foreground",
							)}
							aria-current={isCurrent ? "step" : undefined}
						>
							<span aria-hidden="true" className="text-[0.65rem] leading-none">
								{isCompleted ? "✓" : isCurrent ? "●" : "○"}
							</span>
							{ROOM_STAGE_LABELS[stage]}
						</span>
					</div>
				);
			})}
		</nav>
	);
}
