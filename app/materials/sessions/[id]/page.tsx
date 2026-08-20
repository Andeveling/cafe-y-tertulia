import { ArrowLeftIcon, Message01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
	getSessionHistory,
	SESSION_STATUS_LABELS,
} from "@/app/materials/_lib/materials";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sesión · Histórico · Café y Tertulia" };

export default async function SessionHistoryPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const supabase = await createClient();
	const session = await getSessionHistory(supabase, (await params).id);
	if (!session) notFound();

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
			<Button
				variant="ghost"
				size="sm"
				nativeButton={false}
				render={<Link href={`/materials/${session.material.id}`} />}
				className="w-fit"
			>
				<HugeiconsIcon icon={ArrowLeftIcon} data-icon="inline-start" />
				Volver al material
			</Button>

			<header className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary">Histórico</Badge>
					<Badge variant="outline">
						{SESSION_STATUS_LABELS[session.status]}
					</Badge>
				</div>
				<h1 className="font-heading text-3xl font-semibold">
					{session.material.title}
				</h1>
				<p className="text-muted-foreground">
					{session.range} · {session.material.author}
				</p>
				{session.rating_count > 0 && (
					<p className="text-sm">
						Rating sesión: {session.rating_avg}★ · {session.rating_count} votos
					</p>
				)}
			</header>

			<Card>
				<CardHeader>
					<CardTitle>Preguntas de la sesión</CardTitle>
					<CardDescription>
						Las preguntas que conservaron la conversación.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{session.questions.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No hay preguntas registradas.
						</p>
					) : (
						<ul className="flex flex-col gap-4">
							{session.questions.map((question) => (
								<li
									key={question.id}
									className="flex gap-3 border-b pb-4 last:border-0 last:pb-0"
								>
									<HugeiconsIcon
										icon={Message01Icon}
										className="mt-1 shrink-0 text-muted-foreground"
									/>
									<div className="flex flex-col gap-1">
										<p>{question.text}</p>
										<p className="text-xs text-muted-foreground">
											Pregunta de {question.author}
										</p>
									</div>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
