import { Award01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { partitionBadges } from "@/app/profile/_lib/profile-stats";
import { getBadgeIcon, RECOGNITION_ICONS } from "@/components/badge-icons";
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

function formatEarnedDate(iso: string) {
	return new Date(iso).toLocaleDateString("es", {
		month: "short",
		day: "numeric",
	});
}

function BadgeSlot({ badge }: { badge: MemberBadge }) {
	const dateLabel =
		badge.earned && badge.earnedDate
			? formatEarnedDate(badge.earnedDate)
			: null;
	const fullDateLabel =
		badge.earned && badge.earnedDate
			? new Date(badge.earnedDate).toLocaleDateString("es", {
					day: "numeric",
					month: "long",
					year: "numeric",
				})
			: null;
	const ariaLabel = badge.earned
		? fullDateLabel
			? `${badge.name}, conseguida el ${fullDateLabel}`
			: badge.name
		: `${badge.name}, aún sin conseguir`;
	const icon = getBadgeIcon(badge.key);

	return (
		<Tooltip>
			<TooltipTrigger
				render={<button type="button" />}
				aria-label={ariaLabel}
				className="group relative flex min-w-0 flex-col items-center rounded-lg border-0 bg-transparent p-0 text-inherit focus-visible:ring-3 focus-visible:ring-ring/50"
			>
				<div
					aria-hidden="true"
					className={`relative flex aspect-square w-full items-center justify-center rounded-lg border transition-colors ${
						badge.earned
							? "border-border bg-card/60 text-primary group-hover:bg-muted/40"
							: "border-dashed border-foreground/20 bg-transparent"
					}`}
				>
					{badge.earned && <HugeiconsIcon icon={icon} size={40} />}
				</div>
				<p
					className={`mt-2 line-clamp-2 text-center text-xs font-medium leading-tight ${badge.earned ? "text-foreground" : "text-muted-foreground"}`}
				>
					{badge.name}
				</p>
				{dateLabel && (
					<p className="text-label-sm text-muted-foreground tabular-nums">
						{dateLabel}
					</p>
				)}
			</TooltipTrigger>
			<TooltipContent side="top" align="center">
				<div className="flex flex-col gap-1 text-left">
					{badge.earned ? (
						<>
							<p className="font-semibold">{badge.name}</p>
							<p className="text-xs opacity-90">{badge.description}</p>
							{fullDateLabel && (
								<p className="text-xs opacity-75">
									Conseguida el {fullDateLabel}
								</p>
							)}
						</>
					) : (
						<>
							<p className="font-semibold">{badge.name}</p>
							<p className="text-xs opacity-90">{badge.description}</p>
							<p className="text-xs opacity-75">Aún sin conseguir.</p>
						</>
					)}
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

function RecognitionBanner({
	recognition,
}: {
	recognition: SeasonRecognition;
}) {
	const icon = RECOGNITION_ICONS[recognition.category] ?? Award01Icon;
	return (
		<div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-5 py-3">
			<HugeiconsIcon
				icon={icon}
				size={24}
				className="shrink-0 text-primary"
				aria-hidden="true"
			/>
			<div className="min-w-0">
				<p className="text-sm font-semibold text-foreground">
					{recognition.label}
				</p>
				<p className="text-xs text-muted-foreground">
					Reconocimiento · {recognition.seasonMonth}
				</p>
			</div>
		</div>
	);
}

export function BadgeVitrina({
	badges,
	recognitions,
}: {
	badges: MemberBadge[];
	recognitions: SeasonRecognition[];
}) {
	const {
		individual,
		collective,
		earnedIndividual: earnedCount,
		earnedCollective,
	} = partitionBadges(badges);

	if (
		individual.length === 0 &&
		collective.length === 0 &&
		recognitions.length === 0
	) {
		return (
			<p className="text-sm text-muted-foreground">
				Aún no hay insignias en este grupo.
			</p>
		);
	}

	return (
		<TooltipProvider>
			<div className="flex flex-col gap-8">
				{recognitions.length > 0 && (
					<div className="flex flex-col gap-3">
						{recognitions.map((r, index) => (
							<RecognitionBanner
								key={`${r.category}-${r.seasonMonth}-${index}`}
								recognition={r}
							/>
						))}
					</div>
				)}

				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-1.5">
						<h3 className="font-heading text-lg text-foreground">
							Insignias{" "}
							<span className="font-sans text-sm font-normal text-muted-foreground">
								{earnedCount} de {individual.length} conseguidas
							</span>
						</h3>
						<InfoButton
							title="Insignias"
							description="Tus logros individuales. Se consiguen al participar —por ejemplo, al crear tu primera pregunta— o cuando el Moderador te otorga una durante el debate."
						/>
					</div>
					<div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
						{individual.map((b) => (
							<BadgeSlot key={b.key} badge={b} />
						))}
					</div>
					{earnedCount === 0 && individual.length > 0 && (
						<p className="text-sm text-muted-foreground">
							Aún no conseguiste ninguna. Crea una pregunta para la próxima
							sesión y empieza la colección.
						</p>
					)}
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-1.5">
						<h3 className="font-heading text-lg text-foreground">
							Hitos del grupo{" "}
							<span className="font-sans text-sm font-normal text-muted-foreground">
								{earnedCollective} de {collective.length} conseguidos
							</span>
						</h3>
						<InfoButton
							title="Hitos del grupo"
							description="Los logros de tu grupo entero, como terminar el primer material o alcanzar 50 sesiones. Son del grupo, no individuales."
						/>
					</div>
					<div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
						{collective.map((b) => (
							<BadgeSlot key={b.key} badge={b} />
						))}
					</div>
					{earnedCollective === 0 && collective.length > 0 && (
						<p className="text-sm text-muted-foreground">
							El grupo aún no consiguió hitos. Cada sesión cuenta.
						</p>
					)}
				</div>
			</div>
		</TooltipProvider>
	);
}
