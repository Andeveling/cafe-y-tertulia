import { ArrowLeftIcon, Book01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdvanceButton } from "@/components/materials/advance-button";
import { SessionForm } from "@/components/materials/session-form";
import { MaterialQuestionsSection } from "@/components/questions/material-questions-section";
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
import {
	getMaterial,
	MATERIAL_KIND_LABELS,
	MATERIAL_STATUS_LABELS,
	SESSION_STATUS_LABELS,
} from "@/lib/materials";

export const metadata = {
	title: "Material · Café y Tertulia",
};

export default async function MaterialDetailPage({
	params,
}: PageProps<"/materiales/[id]">) {
	const { id } = await params;
	const material = await getMaterial(id);

	if (!material) {
		notFound();
	}

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
		</div>
	);
}
