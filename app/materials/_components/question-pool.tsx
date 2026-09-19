"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useId, useRef, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
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
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	type ActionResult,
	createQuestionAction,
	toggleOutsideDrawAction,
} from "../_lib/question-actions";
import type { QuestionWithAuthor } from "../_lib/questions";

type QuestionPoolProps = {
	questions: QuestionWithAuthor[];
	sessionId: string;
	sessionRange: string;
	materialId: string;
	currentUserId: string;
	isModerator: boolean;
};

const initialCreateState: ActionResult = { ok: true };

const createQuestionSchema = z.object({
	text: z.string().trim().min(1, "La pregunta no puede estar vacía."),
});

type CreateQuestionValues = z.infer<typeof createQuestionSchema>;

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
	const [isPending, startTransition] = useTransition();
	const fieldId = useId();
	const form = useForm<CreateQuestionValues>({
		resolver: zodResolver(createQuestionSchema),
		defaultValues: {
			text: "",
		},
	});
	const justSubmitted = useRef(false);

	// Reset only after the server action resolved successfully: createState
	// changes after the async action settles, so the reset lives here instead
	// of in onSubmit (where the previous state would be stale).
	useEffect(() => {
		if (justSubmitted.current && createState.ok) {
			form.reset();
			justSubmitted.current = false;
		}
	}, [createState, form]);

	function onSubmit(data: CreateQuestionValues) {
		justSubmitted.current = true;
		startTransition(async () => {
			const formData = new FormData();
			formData.set("session_id", sessionId);
			formData.set("material_id", materialId);
			formData.set("text", data.text);
			await createAction(formData);
		});
	}

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
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-3"
				>
					<FieldGroup>
						<Controller
							name="text"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={fieldId}>Aporta una pregunta</FieldLabel>
									<FieldContent>
										<Textarea
											{...field}
											id={fieldId}
											placeholder="¿Qué te hizo pensar del capítulo 2?"
											aria-invalid={fieldState.invalid}
										/>
									</FieldContent>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</FieldGroup>
					{!createState.ok && (
						<p role="alert" className="text-destructive text-xs">
							{createState.error}
						</p>
					)}
					<div className="flex justify-end">
						<Button type="submit" disabled={createPending || isPending}>
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
									<p className="min-w-0 text-sm leading-relaxed break-words">
										{question.text}
									</p>
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
												aria-label={`Fuera de sorteo: ${question.text.length > 80 ? `${question.text.slice(0, 80)}…` : question.text}`}
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
