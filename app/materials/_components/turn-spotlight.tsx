"use client";

import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { heartsProgressText } from "@/app/materials/_lib/hearts";
import { MemberAvatar } from "@/components/member-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Foco del turno: hero "En la palabra" + tarjeta del reloj. Se renderiza una
 * sola vez — inline o dentro del Dialog de foco — para no duplicar contenido.
 */
export function TurnSpotlight({
	speakerName,
	speakerAvatar,
	speakerVerb,
	isComplement,
	authorName,
	questionText,
	clockText,
	overtime,
	timerPct,
	timerAction,
	heartsVoted,
	heartsEligible,
	voter,
}: {
	speakerName: string;
	speakerAvatar?: string | null;
	speakerVerb: string;
	isComplement: boolean;
	authorName: string;
	questionText: string;
	clockText: string;
	overtime: boolean;
	timerPct: number;
	timerAction?: ReactNode;
	heartsVoted?: number;
	heartsEligible?: number;
	/** Votador de corazones — vive dentro de la card del reloj, sin textos. */
	voter?: ReactNode;
}) {
	return (
		<>
			<section
				aria-label="En la palabra"
				className="w-full rounded-xl bg-card px-6 py-8 text-center ring-1 ring-foreground/10"
			>
				<p className="text-label-sm font-bold tracking-[0.1em] text-muted-foreground uppercase">
					En la palabra
				</p>
				<span aria-hidden="true" className="mx-auto mt-4 block w-fit">
					<MemberAvatar
						name={speakerName}
						avatar={speakerAvatar}
						className="size-[4.5rem] font-heading ring-1 ring-primary/40 [&_[data-slot=avatar-fallback]]:bg-primary/10 [&_[data-slot=avatar-fallback]]:text-2xl [&_[data-slot=avatar-fallback]]:text-primary"
					/>
				</span>
				<p className="font-heading mt-3 text-3xl font-semibold text-balance">
					{speakerName}
				</p>
				<p className="mt-2">
					<span
						className={cn(
							"inline-block rounded-full px-4 py-1 text-xs font-bold tracking-[0.08em] ring-1",
							isComplement
								? "bg-reward/15 text-reward ring-reward/30"
								: "bg-primary/15 text-primary ring-primary/30",
						)}
					>
						{speakerVerb}
					</span>
				</p>
				<div
					aria-hidden="true"
					className="mx-auto my-4 h-px w-16 bg-foreground/15"
				/>
				<p className="text-xs text-muted-foreground">
					Pregunta de {authorName}
				</p>
				<p className="font-heading mx-auto mt-1 max-w-xl text-center text-xl font-medium text-pretty italic leading-snug">
					{questionText}
				</p>
			</section>

			<section
				aria-label="Reloj del turno"
				className="w-full rounded-xl bg-card px-6 py-5 text-center ring-1 ring-foreground/10"
			>
				<div className="flex items-center justify-center gap-3">
					<p
						className={cn(
							"font-heading text-5xl tabular-nums tracking-tight",
							overtime ? "text-destructive" : "text-foreground",
						)}
					>
						{clockText}
					</p>
					{timerAction}
				</div>
				<div
					aria-hidden="true"
					className="mx-auto mt-3 h-1 max-w-md overflow-hidden rounded-full bg-muted"
				>
					<div
						className={cn(
							"h-full rounded-full",
							overtime ? "bg-destructive" : "bg-reward",
						)}
						style={{ width: `${timerPct}%` }}
					/>
				</div>
				{voter && <div className="mt-3">{voter}</div>}
				{heartsVoted != null && heartsEligible != null && (
					<Badge
						variant="outline"
						className="mt-2 tabular-nums"
						role="status"
						aria-live="polite"
						aria-label={`${heartsProgressText(heartsVoted, heartsEligible)} corazones`}
					>
						<HugeiconsIcon
							icon={FavouriteIcon}
							strokeWidth={2}
							className="text-primary"
							aria-hidden="true"
						/>
						{heartsVoted}/{heartsEligible}
					</Badge>
				)}
			</section>
		</>
	);
}
