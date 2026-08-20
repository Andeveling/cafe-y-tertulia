import { ArrowLeftIcon, Book01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdvanceButton } from "@/app/materials/_components/advance-button";
import { MaterialQuestionsSection } from "@/app/materials/_components/material-questions-section";
import { SessionForm } from "@/app/materials/_components/session-form";
import { TriviaBank } from "@/app/materials/_components/trivia-bank";
import { listMaterialTrivias } from "@/app/materials/_lib/minigames";
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
				size="sm"
				render={<Link href="/materiales" />}
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
					<h2 className="font-heading text-sm font-medium">Sesiones</h2>
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
								Aún no hay sesiones para este material. Crea la primera con su
								rango cubierto.
							</p>
						</CardContent>
					</Card>
				) : (
					<ul className="flex flex-col gap-4">
						{material.sessions.map((session) => (
							<li key={session.id} className="flex flex-col gap-3">
								<Card>
									<CardContent className="flex items-center justify-between gap-4">
										<div className="flex min-w-0 flex-col gap-1">
											<span className="font-medium">{session.range}</span>
											{session.status === "archived" && (
												<Link
													href={`/materials/sessions/${session.id}`}
													className="text-sm text-primary hover:underline"
												>
													Ver memoria
												</Link>
											)}
											{session.status === "lobby" && (
												<Link
													href={`/materials/sessions/${session.id}/lobby`}
													className="text-sm text-primary hover:underline"
												>
													Ir al lobby
												</Link>
											)}
											{session.status === "in_progress" && (
												<>
													<Link
														href={`/materials/sessions/${session.id}/stage`}
														className="text-sm text-primary hover:underline"
													>
														Escenario
													</Link>
													<Link
														href={`/materials/sessions/${session.id}/minigames`}
														className="text-sm text-primary hover:underline"
													>
														Minijuegos
													</Link>
													<Link
														href={`/materials/sessions/${session.id}/rating`}
														className="text-sm text-primary hover:underline"
													>
														Rating
													</Link>
												</>
											)}
											<span className="text-xs text-muted-foreground">
												{session.scheduled_at
													? new Date(session.scheduled_at).toLocaleDateString(
															"es",
															{
																day: "numeric",
																month: "long",
																year: "numeric",
															},
														)
													: "Sin fecha programada"}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant="outline">
												{SESSION_STATUS_LABELS[session.status]}
											</Badge>
											{session.status !== "archived" && (
												<AdvanceButton
													kind="session"
													id={session.id}
													materialId={material.id}
												/>
											)}
										</div>
									</CardContent>
								</Card>
								{session.status === "preparation" && (
									<MaterialQuestionsSection
										materialId={material.id}
										sessionId={session.id}
										sessionRange={session.range}
									/>
								)}
							</li>
						))}
					</ul>
				)}
			</section>

			{showTriviaBank && <TriviaBank materialId={material.id} bank={bank} />}
		</div>
	);
}
