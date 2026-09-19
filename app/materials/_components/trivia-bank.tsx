"use client";

import {
	useActionState,
	useEffect,
	useId,
	useRef,
	useState,
	useTransition,
} from "react";
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
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/server-action";
import { createTriviaAction } from "../_lib/minigame-actions";
import type { TriviaBankItem } from "../_lib/minigames";

type Props = {
	materialId: string;
	bank: TriviaBankItem[];
};

const emptyQ = () => ({
	prompt: "",
	options: ["", "", "", ""],
	correct_index: 0,
});

export function TriviaBank({ materialId, bank }: Props) {
	const id = useId();
	const [state, action, pending] = useActionState(createTriviaAction, {
		ok: true,
	} as ActionResult);
	const [, start] = useTransition();
	const [title, setTitle] = useState("");
	const [qs, setQs] = useState([emptyQ(), emptyQ(), emptyQ()]);
	const justSubmitted = useRef(false);

	useEffect(() => {
		if (justSubmitted.current && state.ok) {
			setTitle("");
			setQs([emptyQ(), emptyQ(), emptyQ()]);
			justSubmitted.current = false;
		}
	}, [state]);

	function submit() {
		justSubmitted.current = true;
		const formData = new FormData();
		formData.set("material_id", materialId);
		formData.set("title", title);
		formData.set("items_json", JSON.stringify(qs));
		start(() => action(formData));
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Trivias</CardTitle>
				<CardDescription>
					Banco del material · 3–5 preguntas · el moderador elige en sesión
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{bank.length > 0 && (
					<ul className="list-disc space-y-1 pl-5 text-sm">
						{bank.map((t) => (
							<li key={t.id} className="break-words">
								{t.title}
							</li>
						))}
					</ul>
				)}

				<form
					onSubmit={(event) => {
						event.preventDefault();
						submit();
					}}
					className="flex flex-col gap-3 border-t pt-4"
				>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={`${id}-title`}>
								Título de la trivia
							</FieldLabel>
							<Input
								id={`${id}-title`}
								placeholder="Título de la trivia"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</Field>

						{qs.map((q, qi) => (
							<FieldSet key={qi} className="space-y-2 rounded-md border p-3">
								<FieldLegend variant="label">Pregunta {qi + 1}</FieldLegend>
								<Field>
									<FieldLabel htmlFor={`${id}-q${qi}-prompt`}>
										Enunciado
									</FieldLabel>
									<Textarea
										id={`${id}-q${qi}-prompt`}
										placeholder="Enunciado"
										value={q.prompt}
										onChange={(e) => {
											const next = [...qs];
											next[qi] = { ...q, prompt: e.target.value };
											setQs(next);
										}}
									/>
								</Field>
								<FieldSet>
									<FieldLegend variant="label">
										Opciones — marca la correcta
									</FieldLegend>
									<RadioGroup
										value={String(q.correct_index)}
										onValueChange={(value) => {
											const next = [...qs];
											next[qi] = { ...q, correct_index: Number(value) };
											setQs(next);
										}}
										className="gap-2"
									>
										{q.options.map((opt, oi) => (
											<Field
												key={oi}
												orientation="horizontal"
												className="items-center"
											>
												<RadioGroupItem
													value={String(oi)}
													id={`${id}-q${qi}-correct-${oi}`}
													aria-label={`Marcar opción ${oi + 1} como correcta`}
												/>
												<FieldLabel
													htmlFor={`${id}-q${qi}-opt-${oi}`}
													className="sr-only"
												>
													Opción {oi + 1}
												</FieldLabel>
												<Input
													id={`${id}-q${qi}-opt-${oi}`}
													placeholder={`Opción ${oi + 1}`}
													className="min-w-0 flex-1"
													value={opt}
													onChange={(e) => {
														const opts = [...q.options];
														opts[oi] = e.target.value;
														const next = [...qs];
														next[qi] = { ...q, options: opts };
														setQs(next);
													}}
												/>
											</Field>
										))}
									</RadioGroup>
								</FieldSet>
							</FieldSet>
						))}
					</FieldGroup>
					<div className="flex flex-wrap gap-2">
						{qs.length < 5 && (
							<Button
								type="button"
								variant="outline"
								onClick={() => setQs([...qs, emptyQ()])}
							>
								+ Pregunta
							</Button>
						)}
						{qs.length > 3 && (
							<Button
								type="button"
								variant="ghost"
								onClick={() => setQs(qs.slice(0, -1))}
							>
								Quitar última
							</Button>
						)}
						<Button type="submit" disabled={pending}>
							Guardar trivia
						</Button>
					</div>
					{!state.ok && (
						<p role="alert" className="text-sm text-destructive">
							{state.error}
						</p>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
