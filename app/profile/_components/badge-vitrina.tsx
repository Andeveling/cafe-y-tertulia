"use client";

import { InfoButton } from "@/components/info-button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
	MemberBadge,
	SeasonRecognition,
} from "../_lib/gamification-actions";

/* -------------------------------------------------------------------------- */
/*  Badge slot — individual badge with earned/locked state + tooltip            */
/* -------------------------------------------------------------------------- */

function BadgeSlot({ badge }: { badge: MemberBadge }) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={<div />}
				className="group relative flex flex-col items-center"
			>
				{badge.earned && (
					<div className="absolute -inset-1 rounded-2xl bg-secondary/30 blur-sm transition-all group-hover:bg-secondary/50 group-hover:blur-md" />
				)}
				<div
					className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-all ${
						badge.earned
							? "border-secondary bg-card shadow-md group-hover:shadow-lg group-hover:scale-105 group-hover:-translate-y-1"
							: "border-dashed border-border bg-muted/20"
					}`}
				>
					{badge.earned ? (
						<span className="text-4xl leading-none">{badge.emoji}</span>
					) : (
						<span className="text-3xl leading-none opacity-20 grayscale">
							❓
						</span>
					)}
				</div>
				<p
					className={`mt-2 text-center text-xs font-medium leading-tight ${
						badge.earned ? "text-foreground" : "text-muted-foreground"
					}`}
				>
					{badge.earned ? badge.name : "???"}
				</p>
				{badge.earned && badge.earnedDate && (
					<p className="text-[10px] text-muted-foreground">
						{new Date(badge.earnedDate).toLocaleDateString("es", {
							month: "short",
							day: "numeric",
						})}
					</p>
				)}
			</TooltipTrigger>
			<TooltipContent side="top" align="center">
				<div className="flex flex-col gap-1 text-left">
					<p className="font-semibold">
						{badge.emoji} {badge.name}
					</p>
					<p className="text-xs opacity-90">{badge.description}</p>
					{badge.earned && badge.context && (
						<p className="text-xs opacity-75">{badge.context}</p>
					)}
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

/* -------------------------------------------------------------------------- */
/*  Recognition banner — season recognition highlight                          */
/* -------------------------------------------------------------------------- */

function RecognitionBanner({
	recognition,
}: {
	recognition: SeasonRecognition;
}) {
	return (
		<div className="flex items-center gap-3 rounded-xl border border-secondary/40 bg-gradient-to-r from-secondary/20 via-secondary/10 to-transparent px-5 py-3">
			<span className="text-2xl">{recognition.emoji}</span>
			<div>
				<p className="text-sm font-semibold text-foreground">
					Reconocimiento de la temporada
				</p>
				<p className="text-xs text-muted-foreground">
					{recognition.label} — {recognition.seasonMonth}
				</p>
			</div>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/*  BadgeVitrina — full vitrina display for a member's profile                 */
/* -------------------------------------------------------------------------- */

export function BadgeVitrina({
	badges,
	recognitions,
}: {
	badges: MemberBadge[];
	recognitions: SeasonRecognition[];
}) {
	const individual = badges.filter((b) => b.kind === "individual");
	const collective = badges.filter((b) => b.kind === "collective");
	const earnedCount = individual.filter((b) => b.earned).length;
	const earnedCollective = collective.filter((b) => b.earned).length;

	return (
		<TooltipProvider>
			<div className="flex flex-col gap-6">
				{/* Season recognitions */}
				{recognitions.length > 0 && (
					<div className="flex flex-col gap-3">
						{recognitions.map((r) => (
							<RecognitionBanner key={r.category} recognition={r} />
						))}
					</div>
				)}

				{/* Individual badges */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-1.5">
						<h3 className="font-heading text-lg text-foreground">
							Insignias{" "}
							<span className="text-muted-foreground font-normal text-sm">
								{earnedCount} de {individual.length}
							</span>
						</h3>
						<InfoButton
							title="Insignias"
							description="Logros individuales que recompensan tu participación. Se ganan automáticamente al cumplir un objetivo (como crear tu primera pregunta) o el moderador las otorga en vivo durante el debate."
						/>
					</div>
					<div className="grid grid-cols-3 gap-5 sm:grid-cols-6">
						{individual.map((b) => (
							<BadgeSlot key={b.key} badge={b} />
						))}
					</div>
				</div>

				{/* Collective hitos */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-1.5">
						<h3 className="font-heading text-lg text-foreground">
							Hitos del club{" "}
							<span className="text-muted-foreground font-normal text-sm">
								{earnedCollective} de {collective.length}
							</span>
						</h3>
						<InfoButton
							title="Hitos del club"
							description="Logros colectivos que el club alcanza como grupo: el primer libro terminado, 50 sesiones realizadas, 100 preguntas debatidas. No pertenecen a un miembro sino a todos."
						/>
					</div>
					<div className="grid grid-cols-3 gap-5 sm:grid-cols-6">
						{collective.map((b) => (
							<BadgeSlot key={b.key} badge={b} />
						))}
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}
