"use client";

import { CircleLock01Icon, FavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { aprecioDisplayText } from "@/app/materials/_lib/hearts";
import type { TurnoAprecio } from "@/app/materials/_lib/room-view";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";

type Props = {
	nextAssigneeName: string;
	nextAssigneeAvatar?: string | null;
	youNext: boolean;
	isModerator: boolean;
	/** "Turno 1 de 2" o null cuando no hay progreso. */
	progressText: string | null;
	/** "Revelar pregunta 1 para Ana". */
	revealLabel: string;
	pending?: boolean;
	/** Aprecio del turno recién completado — null antes del primer turno. */
	lastAprecio?: TurnoAprecio | null;
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
	nextAssigneeAvatar,
	youNext,
	isModerator,
	progressText,
	revealLabel,
	pending = false,
	lastAprecio = null,
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

			<LastAprecio aprecio={lastAprecio} />

			<div className="flex flex-col items-center gap-1">
				<span aria-hidden="true">
					<MemberAvatar
						name={nextAssigneeName}
						avatar={nextAssigneeAvatar}
						className="size-16 font-heading ring-1 ring-primary/30 [&_[data-slot=avatar-fallback]]:bg-primary/10 [&_[data-slot=avatar-fallback]]:text-xl [&_[data-slot=avatar-fallback]]:text-primary"
					/>
				</span>
				<p className="font-heading text-3xl font-semibold text-balance lg:text-4xl">
					{nextAssigneeName}
				</p>
				<p className="text-sm text-muted-foreground">
					{copy.role}
					{copy.showModeratorTag && (
						<span className="ml-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-label-sm font-semibold tracking-wide text-primary uppercase">
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

function LastAprecio({ aprecio }: { aprecio: TurnoAprecio | null }) {
	if (!aprecio) return null;
	const respuesta = aprecioDisplayText(
		aprecio.respuestaAvg,
		aprecio.respuestaCount,
	);
	const pregunta = aprecioDisplayText(
		aprecio.preguntaAvg,
		aprecio.preguntaCount,
	);
	return (
		<section
			aria-label={`Aprecio del turno de ${aprecio.assigneeName}`}
			className="flex w-full max-w-[26.25rem] flex-col items-center gap-1 rounded-xl bg-card px-6 py-4 text-center ring-1 ring-foreground/10"
		>
			<p className="flex items-center gap-1.5 text-label-sm font-bold tracking-[0.08em] text-muted-foreground uppercase">
				<HugeiconsIcon
					icon={FavouriteIcon}
					className="size-3.5 text-primary"
					aria-hidden="true"
				/>
				Aprecio del turno · {aprecio.assigneeName}
			</p>
			{respuesta || pregunta ? (
				<p className="text-sm tabular-nums">
					{respuesta && (
						<span>
							Respuesta <span className="font-semibold">{respuesta}</span>
						</span>
					)}
					{respuesta && pregunta && (
						<span aria-hidden="true" className="text-muted-foreground">
							{" "}
							·{" "}
						</span>
					)}
					{pregunta && (
						<span>
							Pregunta <span className="font-semibold">{pregunta}</span>
						</span>
					)}
				</p>
			) : (
				<p className="text-sm text-muted-foreground">
					Este turno no recibió corazones.
				</p>
			)}
		</section>
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
