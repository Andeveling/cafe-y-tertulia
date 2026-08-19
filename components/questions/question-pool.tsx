"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldContent,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	type ActionResult,
	createQuestionAction,
	toggleOutsideDrawAction,
} from "@/lib/actions/questions";
import type { QuestionWithAuthor } from "@/lib/questions";

type QuestionPoolProps = {
	questions: QuestionWithAuthor[];
	sessionId: string;
	sessionRange: string;
	materialId: string;
	currentUserId: string;
	isModerator: boolean;
};

const initialCreateState: ActionResult = { ok: true };

export function QuestionPool({
	questions,
	sessionId,
	sessionRange,
	materialId,
	currentUserId,
	isModerator,
}: QuestionPoolProps) {
	const [createState, createAction, createPending] = useActionState(
		createQuestionAction,
		initialCreateState,
	);
	const [toggleState, toggleAction, togglePending] = useActionState(
		toggleOutsideDrawAction,
		initialCreateState,
	);

	async function onToggle(questionId: string, outsideDraw: boolean) {
		const formData = new FormData();
		formData.set("question_id", questionId);
		formData.set("outside_draw", String(outsideDraw));
		await toggleAction(formData);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Preguntas del pool</CardTitle>
				<CardDescription>
					{`Aportes abiertos para la Sesión ${sessionRange}. Todas las Preguntas
					aportadas entran al Sorteo, presente o no su autor.`}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<form action={createAction} className="flex flex-col gap-3">
					<input type="hidden" name="session_id" value={sessionId} />
					<input type="hidden" name="material_id" value={materialId} />
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="question-text">
								Aporta una pregunta
							</FieldLabel>
							<FieldContent>
								<Textarea
									id="question-text"
									name="text"
									placeholder="¿Qué te hizo pensar del capítulo 2?"
									required
								/>
							</FieldContent>
						</Field>
					</FieldGroup>
					{!createState.ok && (
						<p role="alert" className="text-destructive text-xs">
							{createState.error}
						</p>
					)}
					<div className="flex justify-end">
						<Button type="submit" disabled={createPending}>
							Aportar
						</Button>
					</div>
				</form>

				<ul className="flex flex-col gap-3">
					{questions.map((question) => {
						const isMine = question.authorId === currentUserId;
						return (
							<li
								key={question.id}
								className="flex flex-col gap-2 rounded-md border border-border p-3"
							>
								<div className="flex items-start justify-between gap-2">
									<p className="text-sm leading-relaxed">{question.text}</p>
									{question.outsideDraw && (
										<Badge variant="secondary">Fuera de sorteo</Badge>
									)}
								</div>
								<div className="flex items-center justify-between gap-2">
									<p className="text-xs text-muted-foreground">
										{isMine
											? "Tu pregunta"
											: `Aportada por ${question.authorName}`}
									</p>
									{isModerator && (
										<label className="flex items-center gap-2 text-xs">
											<Switch
												checked={question.outsideDraw}
												disabled={togglePending}
												onCheckedChange={(checked) =>
													onToggle(question.id, checked)
												}
											/>
											Fuera de sorteo
										</label>
									)}
								</div>
							</li>
						);
					})}
					{questions.length === 0 && (
						<li className="text-sm text-muted-foreground">
							Aún no hay preguntas para esta Sesión.
						</li>
					)}
				</ul>
				{!toggleState.ok && (
					<p role="alert" className="text-destructive text-xs">
						{toggleState.error}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
