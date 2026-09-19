import { Message01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { aprecioDisplayText } from "@/app/materials/_lib/hearts";
import type { SessionHistory } from "@/app/materials/_lib/materials";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type Question = SessionHistory["questions"][number];

const ASSIGNMENT_STATE_LABELS: Record<string, string> = {
	hidden: "Oculta",
	preparation: "Preparación",
	exposition: "Exposición",
	complement: "Complemento",
	complete: "Completa",
};

/**
 * Aprecio congelado de una asignación en el Histórico.
 * Solo renderiza cuando hay al menos un corazón registrado.
 */
function AprecioLine({
	assignment,
}: {
	assignment: NonNullable<Question["assignment"]>;
}) {
	const respuesta = aprecioDisplayText(
		assignment.aprecio_exposition_avg ?? null,
		assignment.aprecio_exposition_count ?? 0,
	);
	const pregunta = aprecioDisplayText(
		assignment.aprecio_complement_avg ?? null,
		assignment.aprecio_complement_count ?? 0,
	);
	if (!respuesta && !pregunta) return null;
	return (
		<p className="text-xs tabular-nums text-muted-foreground">
			Aprecio ·{" "}
			{respuesta && (
				<span>
					respuesta <span className="font-semibold">{respuesta}</span>
				</span>
			)}
			{respuesta && pregunta && <span aria-hidden="true"> · </span>}
			{pregunta && (
				<span>
					pregunta <span className="font-semibold">{pregunta}</span>
				</span>
			)}
		</p>
	);
}
/**
 * Preguntas de una sesión en el Histórico.
 * Muestra autor, asignado, Aprecio congelado y notas de respuesta.
 */
export function HistoryQuestions({ questions }: { questions: Question[] }) {
	if (questions.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Preguntas de la sesión</CardTitle>
					<CardDescription>
						Las preguntas que conservaron la conversación.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						No hay preguntas registradas.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Preguntas de la sesión</CardTitle>
				<CardDescription>
					Las preguntas que conservaron la conversación.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-col gap-4">
					{questions.map((question) => (
						<li
							key={question.id}
							className="flex gap-3 border-b pb-4 last:border-0 last:pb-0"
						>
							<HugeiconsIcon
								icon={Message01Icon}
								className="mt-1 shrink-0 text-muted-foreground"
							/>
							<div className="flex flex-col gap-2 min-w-0 flex-1">
								<p>{question.text}</p>
								<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
									<span>
										Pregunta de <strong>{question.author}</strong>
									</span>
									{question.assignment && (
										<>
											<span>·</span>
											<span className="inline-flex items-center gap-1">
												<HugeiconsIcon icon={UserIcon} className="size-3" />
												Respondió{" "}
												<strong>{question.assignment.assignee}</strong>
											</span>
											<Badge variant="outline" className="text-xs">
												{ASSIGNMENT_STATE_LABELS[question.assignment.state] ??
													question.assignment.state}
											</Badge>
										</>
									)}
								</div>
								{question.assignment?.notes && (
									<div className="rounded-lg bg-muted/50 p-3 text-sm">
										<p className="text-xs font-medium text-muted-foreground mb-1">
											Notas de respuesta
										</p>
										<p className="whitespace-pre-wrap">
											{question.assignment.notes}
										</p>
									</div>
								)}
								{question.assignment && (
									<AprecioLine assignment={question.assignment} />
								)}
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
