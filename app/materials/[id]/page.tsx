import {
	Book01Icon,
	CheckmarkCircle01Icon,
	CircleIcon,
	Flag01Icon,
	News01Icon,
	PlayCircleIcon,
	PodcastIcon,
	Time01Icon,
	Video01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MaterialCover } from "@/app/materials/_components/material-cover";
import { MaterialQuestionsSection } from "@/app/materials/_components/material-questions-section";
import { NewSessionDialog } from "@/app/materials/_components/new-session-dialog";
import { RatingDisplay } from "@/app/materials/_components/rating-display";
import { SessionScheduler } from "@/app/materials/_components/session-scheduler";
import { StepIndicator } from "@/app/materials/_components/step-indicator";
import { TriviaBank } from "@/app/materials/_components/trivia-bank";
import { listMaterialTrivias } from "@/app/materials/_lib/minigames";
import { createClient } from "@/lib/supabase/server";
import {
	getClubMilestones,
	getMaterial,
	MATERIAL_KIND_LABELS,
	MATERIAL_STATUS_LABELS,
	type MaterialKind,
	SESSION_STATUS_LABELS,
	type SessionStatus,
} from "../_lib/materials";

export const metadata = {
	title: "Material · Café y Tertulia",
};

const KIND_ICON: Record<MaterialKind, typeof Book01Icon> = {
	book: Book01Icon,
	video: Video01Icon,
	podcast: PodcastIcon,
	article: News01Icon,
};

type StepVariant = "completed" | "active" | "planned";

function sessionStepInfo(status: SessionStatus): {
	variant: StepVariant;
	icon: typeof CheckmarkCircle01Icon;
	cardClass: string;
} {
	switch (status) {
		case "closed":
		case "archived":
			return {
				variant: "completed",
				icon: CheckmarkCircle01Icon,
				cardClass: "border-border bg-card/70 opacity-75",
			};
		case "in_progress":
		case "lobby":
			return {
				variant: "active",
				icon: PlayCircleIcon,
				cardClass: "border-primary bg-card shadow-md",
			};
		default:
			return {
				variant: "planned",
				icon: CircleIcon,
				cardClass: "border-dashed border-border bg-card",
			};
	}
}

export default async function MaterialDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const supabase = await createClient();
	const material = await getMaterial(supabase, id);

	if (!material) {
		notFound();
	}

	const bank = await listMaterialTrivias(supabase, id).catch(() => []);
	const milestones = await getClubMilestones(supabase).catch(() => []);
	const showTriviaBank = material.sessions.some(
		(s) => s.status === "preparation",
	);

	const closedCount = material.sessions.filter(
		(s) => s.status === "closed" || s.status === "archived",
	).length;
	const progressPercent =
		material.status === "finished"
			? 100
			: material.status === "in_progress" && material.sessions.length > 0
				? Math.round((closedCount / material.sessions.length) * 100)
				: material.status === "selected"
					? 10
					: 0;

	const chronologicalSessions = [...material.sessions].reverse();

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-5 md:p-7 lg:p-10">
			<div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
				{/* ── Columna izquierda: info del material ── */}
				<div className="flex flex-col gap-5 lg:col-span-4">
					<article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
						<div className="relative h-36 overflow-hidden bg-accent">
							<MaterialCover
								src={material.image_url}
								alt=""
								fallback={
									<div className="grid h-full w-full place-items-center">
										<HugeiconsIcon
											icon={KIND_ICON[material.kind] ?? Book01Icon}
											className="size-12 text-accent-foreground/60"
											strokeWidth={1.6}
											aria-hidden="true"
										/>
									</div>
								}
							/>
						</div>

						<div className="flex flex-col gap-4 p-6">
							<span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
								<HugeiconsIcon
									icon={KIND_ICON[material.kind] ?? Book01Icon}
									className="size-3"
									aria-hidden="true"
								/>
								{MATERIAL_KIND_LABELS[material.kind]}
							</span>

							<div>
								<h1 className="text-2xl font-semibold tracking-tight">
									{material.title}
								</h1>
								<p className="mt-1 italic text-muted-foreground">
									{material.author}
								</p>
								{material.source_url && (
									<a
										href={material.source_url}
										target="_blank"
										rel="noopener noreferrer"
										className="mt-2 inline-flex font-medium text-primary underline-offset-4 hover:underline"
									>
										Ver recurso ↗
									</a>
								)}
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<span className="w-fit rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
									{MATERIAL_STATUS_LABELS[material.status]}
								</span>
								{material.rating_count > 0 && (
									<RatingDisplay
										value={material.rating_avg}
										count={material.rating_count}
									/>
								)}
							</div>
							{material.status !== "proposed" && (
								<div>
									<div className="mb-2 flex justify-between text-sm text-muted-foreground">
										<span>Estado general</span>
										<span>
											{material.status === "finished"
												? "Finalizado"
												: `En curso (${progressPercent}%)`}
										</span>
									</div>
									<div className="h-1.5 overflow-hidden rounded-full bg-secondary">
										<div
											className="h-full rounded-full bg-primary transition-all"
											style={{ width: `${progressPercent}%` }}
										/>
									</div>
								</div>
							)}
						</div>
					</article>

					{milestones.length > 0 && (
						<div className="rounded-2xl border border-border bg-card p-5">
							<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Hitos del club
							</p>
							<div className="mt-3 flex flex-wrap gap-2">
								{milestones.map((m) => (
									<span
										key={m.id}
										className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
										aria-label={m.name}
										title={m.name}
									>
										<span aria-hidden="true">{m.emoji}</span>
										<span>{m.name}</span>
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				{/* ── Columna derecha: plan de sesiones ── */}
				<div className="min-w-0 lg:col-span-8">
					<div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div className="max-w-prose">
							<h2 className="text-4xl font-semibold leading-none tracking-tight">
								Plan de Tertulias
							</h2>
							<p className="mt-2 text-lg leading-7 text-muted-foreground">
								Organiza y sigue las sesiones para completar este material.
							</p>
						</div>

						<div className="shrink-0 pt-1">
							<NewSessionDialog materialId={material.id} />
						</div>
					</div>

					{chronologicalSessions.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
							<StepIndicator
								icon={Book01Icon}
								variant="planned"
								size="lg"
								className="mx-auto"
							/>
							<p className="mt-3 font-medium text-muted-foreground">
								Aún no hay sesiones
							</p>
							<p className="mt-1 text-sm text-muted-foreground/70">
								Crea la primera sesión para comenzar el plan de tertulias.
							</p>
						</div>
					) : (
						<div className="relative flex flex-col gap-4">
							{chronologicalSessions.map((session) => {
								const isClosed =
									session.status === "closed" || session.status === "archived";
								const isActive =
									session.status === "in_progress" ||
									session.status === "lobby";
								const step = sessionStepInfo(session.status);

								return (
									<article
										key={session.id}
										className={`relative rounded-2xl border p-5 transition ${step.cardClass}`}
									>
										<div className="flex gap-4">
											<StepIndicator
												icon={step.icon}
												variant={step.variant}
												size="lg"
											/>

											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-start justify-between gap-2">
													<div>
														<h3 className="text-lg font-semibold">
															{session.range}
														</h3>
														{session.scheduled_at && (
															<p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
																<HugeiconsIcon
																	icon={Time01Icon}
																	className="size-3.5"
																	aria-hidden="true"
																/>
																{new Date(
																	session.scheduled_at,
																).toLocaleDateString("es", {
																	weekday: "short",
																	day: "numeric",
																	month: "short",
																	hour: "2-digit",
																	minute: "2-digit",
																})}
															</p>
														)}
													</div>
													<div className="flex shrink-0 items-center gap-2">
														<span
															className={`rounded-full px-3 py-1 text-xs font-medium ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
														>
															{SESSION_STATUS_LABELS[session.status]}
														</span>
														{session.rating_count > 0 && (
															<RatingDisplay
																value={session.rating_avg}
																count={session.rating_count}
															/>
														)}
													</div>
												</div>

												{!isClosed && (
													<div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
														<span className="inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-accent-foreground">
															<HugeiconsIcon
																icon={Time01Icon}
																className="size-3"
																aria-hidden="true"
															/>
															{session.scheduled_at ? (
																<time dateTime={session.scheduled_at}>
																	{new Date(
																		session.scheduled_at,
																	).toLocaleDateString("es", {
																		day: "numeric",
																		month: "short",
																	})}
																</time>
															) : (
																"Sin fecha"
															)}
														</span>
														<SessionScheduler
															materialId={material.id}
															sessionId={session.id}
															scheduledAt={session.scheduled_at}
														/>
													</div>
												)}

												<div className="mt-3 flex flex-wrap gap-3 text-sm">
													{session.status === "archived" && (
														<Link
															href={`/materials/sessions/${session.id}`}
															className="font-medium text-primary underline-offset-4 hover:underline"
														>
															Ver memoria
														</Link>
													)}
													{session.status === "lobby" && (
														<Link
															href={`/materials/sessions/${session.id}/lobby`}
															className="font-medium text-primary underline-offset-4 hover:underline"
														>
															Ir a la sala
														</Link>
													)}
													{session.status === "in_progress" && (
														<>
															<Link
																href={`/materials/sessions/${session.id}/stage`}
																className="font-medium text-primary underline-offset-4 hover:underline"
															>
																Escenario
															</Link>
															<Link
																href={`/materials/sessions/${session.id}/minigames`}
																className="font-medium text-primary underline-offset-4 hover:underline"
															>
																Minijuegos
															</Link>
															<Link
																href={`/materials/sessions/${session.id}/rating`}
																className="font-medium text-primary underline-offset-4 hover:underline"
															>
																Rating
															</Link>
														</>
													)}
													{(session.status === "closed" ||
														session.status === "archived") &&
														session.rating_count > 0 && (
															<Link
																href={`/materials/sessions/${session.id}`}
																className="font-medium text-primary underline-offset-4 hover:underline"
															>
																Ver rating en memoria
															</Link>
														)}
												</div>

												{session.status === "preparation" && (
													<div className="mt-3">
														<MaterialQuestionsSection
															materialId={material.id}
															sessionId={session.id}
															sessionRange={session.range ?? ""}
														/>
													</div>
												)}
											</div>
										</div>
									</article>
								);
							})}

							{/* Hito final */}
							<div className="mt-3 flex items-center gap-3 text-sm italic text-muted-foreground">
								<StepIndicator icon={Flag01Icon} variant="planned" size="md" />
								Completar todas las sesiones marca el material como finalizado.
							</div>
						</div>
					)}
				</div>
			</div>

			{showTriviaBank && <TriviaBank materialId={material.id} bank={bank} />}
		</div>
	);
}
