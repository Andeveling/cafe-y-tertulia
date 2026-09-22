"use client";

import type { ReactNode } from "react";
import { MemberAvatar } from "@/components/member-avatar";
import { cn } from "@/lib/utils";

/**
 * Foco del turno consolidado en UNA sola card.
 *
 * El cronómetro miniaturizado comparte el header con el label "En la
 * palabra" (label a la izquierda, reloj a la derecha). Identidad del speaker,
 * pregunta y corazones se apilan en vertical; el voter aparece en fase
 * votable con su label (picker si puede votar, estado con conteo si no).
 * Se renderiza una sola vez — inline o dentro del Dialog de foco — para no
 * duplicar contenido.
 */
export function TurnSpotlight({
	speakerName,
	speakerAvatar,
	speakerVerb,
	authorName,
	questionText,
	clockText,
	overtime,
	timerAction,
	voter,
}: {
	speakerName: string;
	speakerAvatar?: string | null;
	speakerVerb: string;
	isComplement?: boolean;
	authorName: string;
	questionText: string;
	clockText: string;
	overtime: boolean;
	timerAction?: ReactNode;
	/** Bloque de corazones con su label — anclado debajo del blockquote cuando aplica. */
	voter?: ReactNode;
}) {
	return (
		<>
			<section
				aria-label="En la palabra"
				className="w-full rounded-xl bg-card px-6 py-7 text-center ring-1 ring-foreground/10"
			>
				<div className="flex items-center justify-between gap-4">
					<p className="text-label-sm font-bold tracking-[0.1em] text-muted-foreground uppercase">
						En la palabra
					</p>
					<div className="flex items-center gap-3">
						<p
							className={cn(
								"text-sm font-medium tabular-nums",
								overtime ? "text-destructive" : "text-muted-foreground",
							)}
						>
							{clockText}
						</p>
						{timerAction}
					</div>
				</div>

				<span aria-hidden="true" className="mx-auto mt-5 block w-fit">
					<MemberAvatar
						name={speakerName}
						avatar={speakerAvatar}
						className={cn(
							"size-10 font-heading ring-1 ring-foreground/15 [&_[data-slot=avatar-fallback]]:bg-foreground/[0.06] [&_[data-slot=avatar-fallback]]:text-sm [&_[data-slot=avatar-fallback]]:text-muted-foreground",
						)}
					/>
				</span>
				<p className="font-heading mt-3 text-xl font-semibold text-balance">
					{speakerName}
				</p>
				<p className="text-label-sm mt-1.5 font-bold tracking-[0.1em] text-muted-foreground uppercase">
					{speakerVerb}
				</p>
				<blockquote className="mx-auto mt-5 max-w-xl text-center">
					<span
						aria-hidden="true"
						className="font-heading block text-xl leading-none text-muted-foreground/40"
					>
						“
					</span>
					<p className="font-heading mt-2 text-2xl font-medium text-balance italic leading-snug">
						{questionText}
					</p>
					<footer className="mt-4">
						<span className="text-xs text-muted-foreground">
							Pregunta de <cite className="not-italic">{authorName}</cite>
						</span>
					</footer>
				</blockquote>

				{voter && <div className="mt-6 flex justify-center">{voter}</div>}
			</section>
		</>
	);
}
