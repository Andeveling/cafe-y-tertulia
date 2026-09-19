import {
	ArrowUpRight01Icon,
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
import { ClubMilestones } from "@/app/materials/_components/club-milestones";
import { MaterialCategories } from "@/app/materials/_components/material-categories";
import { MaterialCover } from "@/app/materials/_components/material-cover";
import { MaterialQuestionsSection } from "@/app/materials/_components/material-questions-section";
import { NewSessionDialog } from "@/app/materials/_components/new-session-dialog";
import { RatingDisplay } from "@/app/materials/_components/rating-display";
import { SessionScheduler } from "@/app/materials/_components/session-scheduler";
import { StepIndicator } from "@/app/materials/_components/step-indicator";
import { TriviaBank } from "@/app/materials/_components/trivia-bank";
import {
	getMaterialCategories,
	getMemberMastery,
	listCategories,
} from "@/app/materials/_lib/categories";
import { isActiveMember } from "@/app/materials/_lib/members";
import { listMaterialTrivias } from "@/app/materials/_lib/minigames";
import {
	getSessionPools,
	type QuestionWithAuthor,
} from "@/app/materials/_lib/questions";
import { createClient } from "@/lib/supabase/server";
import {
	getClubMilestones,
	getMaterial,
	MATERIAL_KIND_LABELS,
	MATERIAL_STATUS_LABELS,
	type MaterialKind,
	type MaterialStatus,
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

const sessionActionClassName =
	"inline-flex min-h-11 items-center rounded-md px-1 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline focus-visible:ring-3 focus-visible:ring-ring/50";

function materialProgressCaption(
	status: MaterialStatus,
	percent: number,
): string {
	if (status === "finished") return MATERIAL_STATUS_LABELS.finished;
	if (status === "in_progress") {
		return `${MATERIAL_STATUS_LABELS.in_progress} (${percent}%)`;
	}
	return MATERIAL_STATUS_LABELS[status];
}

function planSessionOrder(
	a: { id: string; scheduled_at: string | null; created_at: string },
	b: { id: string; scheduled_at: string | null; created_at: string },
): number {
	const aKey = a.scheduled_at ?? a.created_at;
	const bKey = b.scheduled_at ?? b.created_at;
	const byTime = aKey.localeCompare(bKey);
	return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
}

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
				cardClass: "border-border bg-muted/40",
			};
		case "in_progress":
		case "lobby":
			return {
				variant: "active",
				icon: PlayCircleIcon,
				cardClass: "border-primary bg-card",
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
	const [material, bank, milestones, categories, materialCategories, authData] =
		await Promise.all([
			getMaterial(supabase, id),
			listMaterialTrivias(supabase, id).catch(() => []),
			getClubMilestones(supabase).catch(() => []),
			listCategories(supabase).catch(() => []),
			getMaterialCategories(supabase, id).catch(() => []),
			supabase.auth.getUser().then(({ data }) => data.user),
		]);

	if (!material) {
		notFound();
	}

	const viewer = authData ?? null;
	const canTag = viewer
		? await isActiveMember(supabase, viewer.id).catch(() => false)
		: false;
	const mastery = viewer
		? await getMemberMastery(supabase, viewer.id).catch(() => [])
		: [];

	const showTriviaBank = material.sessions.some(
		(s) => s.status === "preparation",
	);
	const prepIds = material.sessions
		.filter((s) => s.status === "preparation")
		.map((s) => s.id);

	let currentUserId: string | null = null;
	let poolsBySession = new Map<string, QuestionWithAuthor[]>();

	if (prepIds.length > 0 && viewer && canTag) {
		currentUserId = viewer.id;
		poolsBySession = await getSessionPools(supabase, prepIds);
	}

	const closedCount = material.sessions.filter(
		(s) => s.status === "closed" || s.status === "archived",
	).length;
	const progressPercent =
		material.status === "finished"
			? 100
			: material.sessions.length > 0
				? Math.round((closedCount / material.sessions.length) * 100)
				: 0;

	const chronologicalSessions = [...material.sessions].sort(planSessionOrder);

	return (
		<div className="flex flex-col gap-8">
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
				{/* ── Columna izquierda: info del material ── */}
				<div className="flex min-w-0 flex-col gap-5 lg:col-span-4">
					<article className="overflow-hidden rounded-2xl border border-border bg-card">
						<div className="relative h-36 overflow-hidden bg-accent">
							<MaterialCover
								src={material.image_url}
								alt={material.title}
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

							<div className="min-w-0">
								<h1 className="font-heading text-2xl font-semibold tracking-tight text-balance break-words">
									{material.title}
								</h1>
								<p className="mt-1 break-words italic text-muted-foreground">
									{material.author}
								</p>
								{material.source_url && (
									<a
										href={material.source_url}
										target="_blank"
										rel="noopener noreferrer"
										className={`${sessionActionClassName} mt-2 gap-1.5`}
									>
										Ver recurso
										<HugeiconsIcon
											icon={ArrowUpRight01Icon}
											className="size-3.5"
											aria-hidden="true"
										/>
										<span className="sr-only">
											(se abre en una pestaña nueva)
										</span>
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
							{categories.length > 0 && (
								<MaterialCategories
									materialId={material.id}
									all={categories}
									initialIds={materialCategories.map((c) => c.id)}
									mastery={mastery
										.filter((m) =>
											materialCategories.some((c) => c.id === m.category.id),
										)
										.map((m) => ({
											categoryId: m.category.id,
											categoryName: m.category.name,
											level: m.level,
											points: m.points,
										}))}
									canEdit={canTag}
								/>
							)}
							{material.status !== "proposed" && (
								<div>
									<div className="mb-2 flex justify-between gap-2 text-sm text-muted-foreground">
										<span>Avance</span>
										<span className="text-right">
											{materialProgressCaption(
												material.status,
												progressPercent,
											)}
										</span>
									</div>
									<div
										className="h-1.5 overflow-hidden rounded-full bg-secondary"
										aria-hidden="true"
									>
										<div
											className="h-full rounded-full bg-primary transition-all"
											style={{ width: `${progressPercent}%` }}
										/>
									</div>
								</div>
							)}
						</div>
					</article>

					<ClubMilestones milestones={milestones} />
				</div>

				{/* ── Columna derecha: plan de sesiones ── */}
				<div className="min-w-0 lg:col-span-8">
					<div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div className="max-w-prose">
							<h2 className="font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl">
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
														<h3 className="text-lg font-semibold break-words">
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
													<div className="mt-4">
														<SessionScheduler
															materialId={material.id}
															sessionId={session.id}
															scheduledAt={session.scheduled_at}
														/>
													</div>
												)}

												<div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
													{session.status === "archived" && (
														<Link
															href={`/materials/sessions/${session.id}`}
															className={sessionActionClassName}
														>
															Ver memoria
														</Link>
													)}
													{session.status === "lobby" && (
														<Link
															href={`/materials/sessions/${session.id}/lobby`}
															className={sessionActionClassName}
														>
															Ir a la sala
														</Link>
													)}
													{session.status === "in_progress" && (
														<>
															<Link
																href={`/materials/sessions/${session.id}/stage`}
																className={sessionActionClassName}
															>
																Escenario
															</Link>
															<Link
																href={`/materials/sessions/${session.id}/minigames`}
																className={sessionActionClassName}
															>
																Minijuegos
															</Link>
															<Link
																href={`/materials/sessions/${session.id}/rating`}
																className={sessionActionClassName}
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
																className={sessionActionClassName}
															>
																Ver rating en memoria
															</Link>
														)}
												</div>

												{session.status === "preparation" && currentUserId && (
													<div className="mt-3">
														<MaterialQuestionsSection
															materialId={material.id}
															sessionId={session.id}
															sessionRange={session.range ?? ""}
															questions={poolsBySession.get(session.id) ?? []}
															currentUserId={currentUserId}
															isModerator={
																session.moderator_id === currentUserId
															}
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
								Completar todas las sesiones marca el material como terminado.
							</div>
						</div>
					)}
				</div>
			</div>

			{showTriviaBank && <TriviaBank materialId={material.id} bank={bank} />}
		</div>
	);
}
