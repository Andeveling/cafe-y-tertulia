import { getCachedMemberBadges } from "@/app/profile/_lib/cached-badges";
import { getMemberLevel } from "@/app/profile/_lib/gamification-actions";
import {
	levelProgress,
	partitionBadges,
	statusLabel,
} from "@/app/profile/_lib/profile-stats";
import { MemberAvatar } from "@/components/member-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function HeroSkeleton() {
	return (
		<div
			role="status"
			aria-label="Cargando tu camino en el club"
			className="animate-pulse rounded-xl border border-border/60 bg-card p-6 md:p-8"
		>
			<div className="h-24 w-2/3 rounded-lg bg-muted" />
			<span className="sr-only">Cargando…</span>
		</div>
	);
}

/** Hero del pasaporte: nivel + progreso + stats. Hace stream con Suspense. */
export async function HeroSection({
	memberId,
	displayName,
	status,
	avatar,
}: {
	memberId: string;
	displayName: string;
	status: string;
	avatar: string | null;
}) {
	const [level, { badges, recognitions }] = await Promise.all([
		getMemberLevel(memberId),
		getCachedMemberBadges(memberId),
	]);
	const { earnedIndividual, totalIndividual } = partitionBadges(badges);
	const { progress, sessionsToNext } = levelProgress(level);

	return (
		<section aria-label="Tu camino en el club">
			<Card className="overflow-hidden">
				<div
					aria-hidden="true"
					className="h-1.5 w-full bg-gradient-to-r from-primary via-primary-container to-primary"
				/>
				<CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:gap-8 md:p-8">
					{/* Sello de nivel */}
					<div className="flex min-w-0 items-center gap-5 md:flex-col md:items-center md:gap-3 md:text-center">
						<div className="relative shrink-0">
							<MemberAvatar
								name={displayName}
								avatar={avatar}
								className="size-20 font-heading ring-1 ring-primary/40 md:size-24 [&_[data-slot=avatar-fallback]]:bg-card [&_[data-slot=avatar-fallback]]:text-2xl [&_[data-slot=avatar-fallback]]:font-semibold [&_[data-slot=avatar-fallback]]:text-foreground md:[&_[data-slot=avatar-fallback]]:text-3xl"
							/>
							<div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
								<Badge
									variant="default"
									className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
								>
									Nv {level.level}
								</Badge>
							</div>
						</div>
						<div className="min-w-0 md:mt-3">
							<h1 className="font-heading text-2xl font-semibold tracking-tight text-balance break-words md:text-3xl">
								{displayName}
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								{level.title || "Recién llegado"} ·{" "}
								<span className="font-medium text-foreground">
									{statusLabel(status)}
								</span>
							</p>
						</div>
					</div>

					{/* Progreso + stats */}
					<div className="flex flex-1 flex-col gap-5 md:border-l md:border-border/60 md:pl-8">
						<div>
							<div className="flex items-baseline justify-between gap-3">
								<p className="text-label-sm font-semibold tracking-wider text-muted-foreground uppercase">
									Camino a {level.nextTitle}
								</p>
								<p className="text-label-sm text-muted-foreground tabular-nums">
									{level.sessionsAttended} / {level.nextThreshold} sesiones
								</p>
							</div>
							<Progress
								value={progress}
								aria-label={`Progreso a ${level.nextTitle}: ${progress} por ciento`}
								className="mt-2.5 [&_[data-slot='progress-track']]:h-1.5"
							/>
							<p className="mt-2 text-sm text-muted-foreground">
								{sessionsToNext === 0 ? (
									<>
										Nivel máximo por sesiones. Las insignias siguen contando
										{level.nextInsigniasRequired > 0 &&
											` · te faltan ${level.nextInsigniasRequired} para ${level.nextTitle}`}
										.
									</>
								) : (
									<>
										Te faltan{" "}
										<span className="font-semibold text-foreground tabular-nums">
											{sessionsToNext}{" "}
											{sessionsToNext === 1 ? "sesión" : "sesiones"}
										</span>{" "}
										para ser {level.nextTitle}
										{level.nextInsigniasRequired > 0 &&
											` + ${level.nextInsigniasRequired} ${level.nextInsigniasRequired === 1 ? "insignia" : "insignias"}`}
										.
									</>
								)}
							</p>
						</div>

						<dl className="grid grid-cols-3 gap-3">
							{heroStats({
								sessions: level.sessionsAttended,
								badges: `${earnedIndividual}/${totalIndividual}`,
								seasons: recognitions.length,
							}).map((s) => (
								<div
									key={s.label}
									className="min-w-0 rounded-xl border border-border/60 bg-muted/30 px-3 py-3 text-center"
								>
									<dt className="text-label-sm font-medium text-muted-foreground">
										{s.label}
									</dt>
									<dd className="font-heading text-2xl font-semibold text-foreground tabular-nums">
										{s.value}
										<span className="mt-0.5 block font-sans text-label-sm font-medium text-muted-foreground">
											{s.hint}
										</span>
									</dd>
								</div>
							))}
						</dl>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}

/** Stats estáticas del hero, fuera del componente (rendering-hoist-jsx). */
function heroStats({
	sessions,
	badges,
	seasons,
}: {
	sessions: number;
	badges: string;
	seasons: number;
}) {
	return [
		{ label: "Sesiones", value: sessions, hint: "tertulias vividas" },
		{ label: "Insignias", value: badges, hint: "logros propios" },
		{ label: "Temporadas", value: seasons, hint: "reconocimientos" },
	];
}
