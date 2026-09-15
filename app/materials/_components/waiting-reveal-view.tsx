"use client";

import { CircleLock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";

type Props = {
	nextAssigneeName: string;
	youNext: boolean;
	isModerator: boolean;
	/** "Turno 1 de 2" o null cuando no hay progreso. */
	progressText: string | null;
	/** "Revelar pregunta 1 para Ana". */
	revealLabel: string;
	pending?: boolean;
	onReveal?: () => void;
};

type SceneCopy = {
	envelopeLead: string;
	envelopeHint: string;
	role: string;
	showModeratorTag: boolean;
	status: string | null;
};

function sceneCopy(youNext: boolean, isModerator: boolean): SceneCopy {
	if (isModerator && youNext) {
		return {
			envelopeLead: "La pregunta está sellada.",
			envelopeHint: "Se revelará al abrir.",
			role: "Tu turno",
			showModeratorTag: true,
			status:
				"Te toca en un momento. La pregunta sigue oculta hasta que la reveles.",
		};
	}
	if (isModerator) {
		return {
			envelopeLead: "La pregunta está sellada.",
			envelopeHint: "Se revelará al abrir.",
			role: "Próximo en intervenir",
			showModeratorTag: false,
			status: null,
		};
	}
	if (youNext) {
		return {
			envelopeLead: "La pregunta está sellada.",
			envelopeHint: "Prepárate.",
			role: "Tu turno",
			showModeratorTag: false,
			status:
				"Te toca en un momento. La pregunta se revelará pronto. Respira, conecta, suelta.",
		};
	}
	return {
		envelopeLead: "La pregunta está sellada.",
		envelopeHint: "Espera a que el moderador la revele.",
		role: "Próximo en intervenir",
		showModeratorTag: false,
		status: "El moderador revelará la pregunta cuando corresponda.",
	};
}

/**
 * WaitingRevealView — pausa ceremonial entre Intervenciones del Debate.
 * Vista pura: sin Supabase ni mutaciones. La Pregunta permanece sellada;
 * el caller aporta `onReveal` (revealNext) y `pending`.
 */
export function WaitingRevealView({
	nextAssigneeName,
	youNext,
	isModerator,
	progressText,
	revealLabel,
	pending = false,
	onReveal,
}: Props) {
	const copy = sceneCopy(youNext, isModerator);

	return (
		<div className="flex flex-col items-center gap-8 py-8 text-center">
			{progressText && (
				<p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
					{progressText}
				</p>
			)}

			<SealedPregunta lead={copy.envelopeLead} hint={copy.envelopeHint} />

			<div className="flex flex-col items-center gap-1">
				<p className="font-heading text-3xl font-semibold text-balance lg:text-4xl">
					{nextAssigneeName}
				</p>
				<p className="text-sm text-muted-foreground">
					{copy.role}
					{copy.showModeratorTag && (
						<span className="ml-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
							Moderador
						</span>
					)}
				</p>
			</div>

			{copy.status && (
				<p className="max-w-sm text-sm text-muted-foreground text-pretty">
					{copy.status}
				</p>
			)}

			{isModerator && onReveal && (
				<div className="flex flex-col items-center gap-2">
					<Button size="lg" disabled={pending} onClick={onReveal}>
						{revealLabel}
					</Button>
					<p className="text-xs text-muted-foreground italic">
						La verán todos. No se puede des-revelar.
					</p>
				</div>
			)}
		</div>
	);
}

function SealedPregunta({ lead, hint }: { lead: string; hint: string }) {
	return (
		<section
			aria-label="Pregunta sellada"
			className="relative flex aspect-[4/3] w-full max-w-[26.25rem] flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-card px-8 py-10"
		>
			<span
				aria-hidden
				className="pointer-events-none absolute top-3 left-3 size-6 rounded-tl-sm border-t border-l border-border/40"
			/>
			<span
				aria-hidden
				className="pointer-events-none absolute top-3 right-3 size-6 rounded-tr-sm border-t border-r border-border/40"
			/>
			<span
				aria-hidden
				className="pointer-events-none absolute bottom-3 left-3 size-6 rounded-bl-sm border-b border-l border-border/40"
			/>
			<span
				aria-hidden
				className="pointer-events-none absolute right-3 bottom-3 size-6 rounded-br-sm border-r border-b border-border/40"
			/>
			<div
				aria-hidden
				className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
			>
				<HugeiconsIcon icon={CircleLock01Icon} className="size-7" />
			</div>
			<p className="font-heading max-w-[16.25rem] text-sm text-muted-foreground italic">
				{lead}
				<br />
				{hint}
			</p>
		</section>
	);
}
