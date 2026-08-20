"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	type ActionResult,
	createTriviaAction,
} from "../_lib/minigame-actions";
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
	const [state, action, pending] = useActionState(createTriviaAction, {
		ok: true,
	} as ActionResult);
	const [, start] = useTransition();
	const [title, setTitle] = useState("");
	const [qs, setQs] = useState([emptyQ(), emptyQ(), emptyQ()]);

	function submit() {
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
					<ul className="text-sm space-y-1">
						{bank.map((t) => (
							<li key={t.id}>• {t.title}</li>
						))}
					</ul>
				)}

				<div className="flex flex-col gap-3 border-t pt-4">
					<Input
						placeholder="Título de la trivia"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
					{qs.map((q, qi) => (
						<div key={qi} className="rounded-md border p-3 space-y-2">
							<p className="text-xs text-muted-foreground">Pregunta {qi + 1}</p>
							<Textarea
								placeholder="Enunciado"
								value={q.prompt}
								onChange={(e) => {
									const next = [...qs];
									next[qi] = { ...q, prompt: e.target.value };
									setQs(next);
								}}
							/>
							{q.options.map((opt, oi) => (
								<div key={oi} className="flex gap-2 items-center">
									<input
										type="radio"
										name={`correct-${qi}`}
										checked={q.correct_index === oi}
										onChange={() => {
											const next = [...qs];
											next[qi] = { ...q, correct_index: oi };
											setQs(next);
										}}
									/>
									<Input
										placeholder={`Opción ${oi + 1}`}
										value={opt}
										onChange={(e) => {
											const opts = [...q.options];
											opts[oi] = e.target.value;
											const next = [...qs];
											next[qi] = { ...q, options: opts };
											setQs(next);
										}}
									/>
								</div>
							))}
						</div>
					))}
					<div className="flex gap-2">
						{qs.length < 5 && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setQs([...qs, emptyQ()])}
							>
								+ Pregunta
							</Button>
						)}
						{qs.length > 3 && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setQs(qs.slice(0, -1))}
							>
								Quitar última
							</Button>
						)}
						<Button type="button" size="sm" disabled={pending} onClick={submit}>
							Guardar trivia
						</Button>
					</div>
					{!state.ok && (
						<p className="text-sm text-destructive">{state.error}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
