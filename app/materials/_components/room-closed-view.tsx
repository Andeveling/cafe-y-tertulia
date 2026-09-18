import { CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { AdvanceButton } from "@/app/materials/_components/advance-button";
import { RatingDisplay } from "@/app/materials/_components/rating-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Rating = {
	avg: number | null;
	count: number;
};

type Props = {
	materialId: string | null;
	sessionId?: string;
	isModerator?: boolean;
	status: "closed" | "archived";
	range: string | null;
	moderatorName: string | null;
	participantsCount: number;
	questionsCount: number;
	rating: Rating | null;
};

/**
 * Vista terminal de la Sala: la Sesión ya se cerró (cerrada/histórico) y sus
 * datos quedaron consolidados. Se compone como la última página de una
 * tertulia: estado + título serif + rating como momento cálido + meta + dos
 * salidas (al material o al club).
 */
export function RoomClosedView({
	materialId,
	sessionId,
	isModerator = false,
	status,
	range,
	moderatorName,
	participantsCount,
	questionsCount,
	rating,
}: Props) {
	const statusLabel = status === "closed" ? "Cerrada" : "Histórico";
	const subtitle = [range, moderatorName ? `Modera ${moderatorName}` : null]
		.filter(Boolean)
		.join(" · ");

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-10 px-5 py-12 text-center md:py-16">
			<header className="flex flex-col items-center gap-5">
				<div className="flex flex-wrap items-center justify-center gap-2">
					<Badge variant="outline">Sala</Badge>
					<Badge variant="secondary">{statusLabel}</Badge>
				</div>

				<h1 className="font-heading text-3xl font-medium tracking-tight text-balance md:text-4xl">
					Sesión finalizada
				</h1>

				{subtitle && (
					<p className="max-w-md text-pretty text-sm text-muted-foreground">
						{subtitle}
					</p>
				)}
			</header>

			<ChapterRule />

			<section
				aria-labelledby="closed-rating-label"
				className="flex w-full flex-col items-center gap-4 rounded-xl border border-border/40 bg-card/30 px-6 py-8"
			>
				<p
					id="closed-rating-label"
					className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground/70"
				>
					<HugeiconsIcon
						icon={CheckmarkBadge01Icon}
						strokeWidth={1.75}
						className="size-3.5"
						aria-hidden="true"
					/>
					Rating de la tertulia
				</p>
				{rating ? (
					<RatingDisplay
						value={rating.avg}
						count={rating.count}
						size="lg"
						className="text-foreground"
					/>
				) : (
					<p className="text-sm text-muted-foreground/60">Sin votos</p>
				)}
			</section>

			<dl className="grid w-full grid-cols-3 gap-4 border-y border-border/40 px-2 py-5 text-sm">
				<MetaCell label="Participantes" value={String(participantsCount)} />
				<MetaCell label="Preguntas" value={String(questionsCount)} />
				<MetaCell
					label="Rating"
					value={
						rating
							? `${rating.count} ${rating.count === 1 ? "voto" : "votos"}`
							: "—"
					}
				/>
			</dl>

			<div className="flex w-full flex-col items-stretch gap-2 sm:max-w-sm sm:flex-row sm:justify-center">
				{materialId && (
					<Button render={<Link href={`/materials/${materialId}`} />}>
						Ir al material
					</Button>
				)}
				<Button variant="outline" render={<Link href="/" />}>
					Volver al club
				</Button>
			</div>
			{status === "closed" && isModerator && sessionId && (
				<AdvanceButton
					kind="session"
					id={sessionId}
					materialId={materialId}
					status={status}
				/>
			)}
		</main>
	);
}

// ─── Chapter rule: separator between heading and the focal moment ────

function ChapterRule() {
	return (
		<div
			aria-hidden="true"
			className="flex w-32 items-center gap-3 text-muted-foreground/40"
		>
			<div className="h-px flex-1 bg-current" />
			<span className="font-serif text-base leading-none">❦</span>
			<div className="h-px flex-1 bg-current" />
		</div>
	);
}

// ─── Meta cell ──────────────────────────────────────────────────────

function MetaCell({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col items-center gap-1">
			<dt className="text-label-sm font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
				{label}
			</dt>
			<dd className="font-heading text-lg font-medium tabular-nums text-foreground">
				{value}
			</dd>
		</div>
	);
}
