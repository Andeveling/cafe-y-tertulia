import { ArrowLeftIcon, Book01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdvanceButton } from "@/app/materials/_components/advance-button";
import { MaterialQuestionsSection } from "@/app/materials/_components/material-questions-section";
import { SessionForm } from "@/app/materials/_components/session-form";
import { SessionScheduler } from "@/app/materials/_components/session-scheduler";
import { TriviaBank } from "@/app/materials/_components/trivia-bank";
import { listMaterialTrivias } from "@/app/materials/_lib/minigames";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import {
	getMaterial,
	MATERIAL_KIND_LABELS,
	MATERIAL_STATUS_LABELS,
	SESSION_STATUS_LABELS,
} from "../_lib/materials";

export const metadata = {
	title: "Material · Café y Tertulia",
};

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
	const showTriviaBank = material.sessions.some(
		(s) => s.status === "preparation",
	);

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
			<Button
				variant="ghost"
				nativeButton={false}
				render={<Link href="/materials" />}
				className="w-fit"
			>
				<HugeiconsIcon icon={ArrowLeftIcon} data-icon="inline-start" />
				Volver a materiales
			</Button>

			<Card>
				<CardHeader className="grid-cols-[1fr_auto]">
					<CardTitle>{material.title}</CardTitle>
					<CardDescription>
						{material.author} · {MATERIAL_KIND_LABELS[material.kind]}
					</CardDescription>
					<Badge variant="secondary">
						{MATERIAL_STATUS_LABELS[material.status]}
					</Badge>
					{material.rating_count > 0 && (
						<Badge variant="outline">
							{material.rating_avg}★ · {material.rating_count}
						</Badge>
					)}
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{material.status !== "finished" && (
						<AdvanceButton kind="material" id={material.id} />
					)}
				</CardContent>
			</Card>

			<Separator />

			<section className="flex flex-col gap-3">
				<div className="flex items-center justify-between gap-4">
					<h2 className="font-heading text-sm font-medium">Capítulos</h2>
					<SessionForm materialId={material.id} />
				</div>

				{material.sessions.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center gap-3 text-center py-8">
							<HugeiconsIcon
								icon={Book01Icon}
								className="text-muted-foreground"
							/>
							<p className="text-sm text-muted-foreground">
								Aún no hay capítulos para este material. Crea el primero con su
								rango cubierto.
							</p>
						</CardContent>
					</Card>
				) : (
					<Accordion
						defaultValue={material.sessions[0] ? [material.sessions[0].id] : []}
						className="flex flex-col gap-3"
					>
						{material.sessions.map((session) => (
							<AccordionItem
								key={session.id}
								value={session.id}
								className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10 data-[open]:ring-primary/20"
							>
								<AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-panel-open]>span]:text-foreground">
									<span className="flex min-w-0 flex-1 items-center gap-2 text-left">
										<span className="truncate font-medium">
											{session.range}
										</span>
										<Badge variant="outline" className="shrink-0">
											{SESSION_STATUS_LABELS[session.status]}
										</Badge>
										{session.rating_count > 0 && (
											<span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">
												{session.rating_avg}★ · {session.rating_count}
											</span>
										)}
									</span>
								</AccordionTrigger>
								<AccordionContent className="px-0 pb-0">
									<div className="flex flex-col gap-4 px-4 pb-4">
										<div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
											<div className="flex min-w-0 flex-col gap-1">
												{session.rating_count > 0 && (
													<span className="text-xs tabular-nums text-muted-foreground">
														{session.rating_avg}★ · {session.rating_count}{" "}
														{session.rating_count === 1 ? "voto" : "votos"} ·
														congelado
													</span>
												)}
												{session.status !== "archived" && (
													<SessionScheduler
														materialId={material.id}
														sessionId={session.id}
														scheduledAt={session.scheduled_at}
													/>
												)}
											</div>
											<div className="flex shrink-0 items-center gap-2">
												{session.status !== "archived" && (
													<AdvanceButton
														kind="session"
														id={session.id}
														materialId={material.id}
														status={session.status}
													/>
												)}
											</div>
										</div>

										<div className="flex flex-wrap gap-2 text-sm">
											{session.status === "archived" && (
												<Link
													href={`/materials/sessions/${session.id}`}
													className="text-primary hover:underline"
												>
													Ver memoria
												</Link>
											)}
											{session.status === "lobby" && (
												<Link
													href={`/materials/sessions/${session.id}/lobby`}
													className="text-primary hover:underline"
												>
													Ir al lobby
												</Link>
											)}
											{session.status === "in_progress" && (
												<>
													<Link
														href={`/materials/sessions/${session.id}/stage`}
														className="text-primary hover:underline"
													>
														Escenario
													</Link>
													<Link
														href={`/materials/sessions/${session.id}/minigames`}
														className="text-primary hover:underline"
													>
														Minijuegos
													</Link>
													<Link
														href={`/materials/sessions/${session.id}/rating`}
														className="text-primary hover:underline"
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
														className="text-primary hover:underline"
													>
														Ver rating en memoria
													</Link>
												)}
										</div>

										{session.status === "preparation" && (
											<MaterialQuestionsSection
												materialId={material.id}
												sessionId={session.id}
												sessionRange={session.range}
											/>
										)}
									</div>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				)}
			</section>

			{showTriviaBank && <TriviaBank materialId={material.id} bank={bank} />}
		</div>
	);
}
