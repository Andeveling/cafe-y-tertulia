import { Message01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
 * Preguntas de una sesión en el Histórico.
 * Muestra autor, asignado y notas de respuesta cuando existen.
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
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
