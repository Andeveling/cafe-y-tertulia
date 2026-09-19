import { BadgeVitrina } from "@/app/profile/_components/badge-vitrina";
import { LeaveClubDialog } from "@/app/profile/_components/leave-club-dialog";
import { UpdateProfileForm } from "@/app/profile/_components/update-profile-form";
import type {
	MemberBadge,
	MemberLevel,
	SeasonRecognition,
} from "@/app/profile/_lib/gamification-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { signOut } from "../_lib/profile-actions";

export type ProfileViewProps = {
	displayName: string;
	status: string;
	level: MemberLevel;
	badges: MemberBadge[];
	recognitions: SeasonRecognition[];
	updated?: boolean;
	updateFailed?: boolean;
};

function statusLabel(status: string) {
	if (status === "active") return "activo";
	if (status === "invited") return "invitado";
	return "baja";
}

function initials(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "·";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileView({
	displayName,
	status,
	level,
	badges,
	recognitions,
	updated,
	updateFailed,
}: ProfileViewProps) {
	const earnedIndividual = badges.filter(
		(b) => b.kind === "individual" && b.earned,
	).length;
	const totalIndividual = badges.filter((b) => b.kind === "individual").length;
	const span =
		level.nextThreshold > level.currentThreshold
			? level.nextThreshold - level.currentThreshold
			: 1;
	const progress = Math.min(
		100,
		Math.max(
			0,
			Math.round(
				((level.sessionsAttended - level.currentThreshold) / span) * 100,
			),
		),
	);
	const sessionsToNext = Math.max(
		0,
		level.nextThreshold - level.sessionsAttended,
	);

	return (
		<div className="flex-1">
			{/* ── Pasaporte de tertulia · hero gamificado ─────────────────── */}
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
								<div className="flex size-20 items-center justify-center rounded-full border bg-card font-heading text-2xl font-semibold text-foreground ring-1 ring-primary/40 md:size-24 md:text-3xl">
									{initials(displayName)}
								</div>
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
								{[
									{
										label: "Sesiones",
										value: level.sessionsAttended,
										hint: "tertulias vividas",
									},
									{
										label: "Insignias",
										value: `${earnedIndividual}/${totalIndividual}`,
										hint: "logros propios",
									},
									{
										label: "Temporadas",
										value: recognitions.length,
										hint: "reconocimientos",
									},
								].map((s) => (
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

			{updated && (
				<div
					role="status"
					className="mt-4 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground"
				>
					Perfil actualizado. Tu nombre ya se ve en el club.
				</div>
			)}

			{updateFailed && (
				<div
					role="alert"
					className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
				>
					No pudimos guardar los cambios. Intentá de nuevo.
				</div>
			)}

			{/* ── Vitrina ─────────────────────────────────────────────────── */}
			<section aria-labelledby="vitrina-heading" className="mt-12">
				<Card>
					<CardHeader>
						<div className="min-w-0">
							<CardTitle className="font-heading text-xl">
								<h2 id="vitrina-heading">Vitrina de la tertulia</h2>
							</CardTitle>
							<CardDescription>
								Tus insignias y los hitos que el club consiguió contigo.
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						<BadgeVitrina badges={badges} recognitions={recognitions} />
					</CardContent>
				</Card>
			</section>

			{/* ── Ajustes tranquilos ──────────────────────────────────────── */}
			<section aria-label="Ajustes del perfil" className="mt-12">
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								<h2>Nombre visible</h2>
							</CardTitle>
							<CardDescription>
								Es el nombre con el que te ve el resto del club.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<UpdateProfileForm defaultDisplayName={displayName} />
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								<h2>Membresía</h2>
							</CardTitle>
							<CardDescription>
								Estado:{" "}
								<span className="font-medium text-foreground">
									{statusLabel(status)}
								</span>
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<p className="text-sm text-muted-foreground">
								Si te das de baja, tus aportes quedan como memoria del club y no
								podrás iniciar sesión.
							</p>
							<LeaveClubDialog />
						</CardContent>
					</Card>
				</div>

				<div className="mt-8 flex justify-center">
					<form action={signOut}>
						<Button type="submit" variant="ghost" className="min-h-11">
							Cerrar sesión
						</Button>
					</form>
				</div>
			</section>
		</div>
	);
}
