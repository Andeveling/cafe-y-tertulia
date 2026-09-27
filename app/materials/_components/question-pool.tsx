"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionWithAuthor } from "../_lib/questions";
import { saveQuestion, toggleOutsideDrawQuestion } from "../_lib/room-actions";

type QuestionPoolProps = {
	questions: QuestionWithAuthor[];
	sessionId: string;
	sessionRange: string;
	currentUserId: string;
	isModerator: boolean;
};

const createQuestionSchema = z.object({
	text: z.string().trim().min(1, "La pregunta no puede estar vacía."),
});

type CreateQuestionValues = z.infer<typeof createQuestionSchema>;

export function QuestionPool({
	questions,
	sessionId,
	sessionRange,
	currentUserId,
	isModerator,
}: QuestionPoolProps) {
	const [pending, startTransition] = useTransition();
	const [createError, setCreateError] = useState<string | null>(null);
	const [toggleError, setToggleError] = useState<string | null>(null);
	const fieldId = useId();
	const form = useForm<CreateQuestionValues>({
		resolver: zodResolver(createQuestionSchema),
		defaultValues: {
			text: "",
		},
	});

	function onSubmit(data: CreateQuestionValues) {
		setCreateError(null);
		startTransition(async () => {
			const result = await saveQuestion(sessionId, data.text);
			if (!result.ok) {
				setCreateError(result.error);
				return;
			}
			form.reset();
		});
	}

	function onToggle(questionId: string, outsideDraw: boolean) {
		setToggleError(null);
		startTransition(async () => {
			const result = await toggleOutsideDrawQuestion(
				sessionId,
				questionId,
				outsideDraw,
			);
			if (!result.ok) setToggleError(result.error);
		});
	}

	return (
		<section className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h4 className="font-heading text-base font-semibold">
					Preguntas del pool
				</h4>
				<p className="text-sm text-muted-foreground">
					Aportes abiertos para la Sesión {sessionRange}. Entran al Sorteo las
					de presentes que no miran.
				</p>
			</div>
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
				{createError && (
					<p role="alert" className="text-destructive text-xs">
						{createError}
					</p>
				)}
				<div className="flex justify-end">
					<Button type="submit" disabled={pending}>
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
											disabled={pending}
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
			{toggleError && (
				<p role="alert" className="text-destructive text-xs">
					{toggleError}
				</p>
			)}
		</section>
	);
}
