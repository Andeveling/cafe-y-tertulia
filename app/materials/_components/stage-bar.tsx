"use client";

import {
	CommentIcon,
	DiceIcon,
	Flag01Icon,
	MessageQuestionIcon,
	Tick01Icon,
	UserCheckIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
 * Icono por etapa. El completada usa Tick01 universal; las demás usan un
 * icono semántico del tema (pregunta, asistencia, sorteo, debate, cierre).
 */
const STAGE_ICON = {
	questions: MessageQuestionIcon,
	presence: UserCheckIcon,
	draw: DiceIcon,
	debate: CommentIcon,
	cierre: Flag01Icon,
} as const;

/**
 * Barra de etapas de la Sala. La etapa actual se distingue por fondo ámbar
 * sólido; las completadas llevan Tick01 + texto ámbar; las futuras quedan
 * muted con su icono en outline.
 */
export function StageBar({ current, className }: Props) {
	const currentIdx = ROOM_STAGE_ORDER.indexOf(current);

	return (
		<nav
			aria-label="Etapas de la Sala"
			className={cn("flex flex-wrap items-center gap-1", className)}
		>
			{ROOM_STAGE_ORDER.map((stage, idx) => {
				const isCompleted = idx < currentIdx;
				const isCurrent = idx === currentIdx;
				const StageIcon = STAGE_ICON[stage];
				const showConnector = idx > 0;
				const connectorDone = idx <= currentIdx;

				return (
					<div key={stage} className="flex items-center gap-1">
						{showConnector && (
							<span
								aria-hidden="true"
								className={cn(
									"h-px w-4 transition-colors sm:w-6",
									connectorDone ? "bg-primary" : "bg-muted-foreground/30",
								)}
							/>
						)}
						<span
							aria-current={isCurrent ? "step" : undefined}
							className={cn(
								"flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
								isCompleted &&
									"border border-primary/25 bg-primary/10 text-primary",
								isCurrent && "bg-primary text-primary-foreground shadow-xs",
								!isCompleted &&
									!isCurrent &&
									"border border-border/60 bg-muted text-muted-foreground",
							)}
						>
							<HugeiconsIcon
								icon={isCompleted ? Tick01Icon : StageIcon}
								strokeWidth={isCompleted ? 2.5 : 1.75}
								className="size-3.5"
								aria-hidden="true"
							/>
							{ROOM_STAGE_LABELS[stage]}
						</span>
					</div>
				);
			})}
		</nav>
	);
}
