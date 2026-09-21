"use client";

import { useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createQuestionAction } from "@/app/materials/_lib/question-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function PrepareQuestionForm({
	sessionId,
	onSuccess,
}: {
	sessionId: string;
	onSuccess?: () => void;
}) {
	const id = useId();
	const formRef = useRef<HTMLFormElement>(null);
	const [pending, start] = useTransition();
	const [error, setError] = useState<string | null>(null);

	return (
		<form
			ref={formRef}
			className="flex flex-col gap-3 px-4"
			onSubmit={(e) => {
				e.preventDefault();
				const text = String(
					new FormData(e.currentTarget).get("text") ?? "",
				).trim();
				if (!text) {
					setError("La pregunta no puede estar vacía.");
					return;
				}
				setError(null);
				start(async () => {
					const fd = new FormData();
					fd.set("session_id", sessionId);
					fd.set("text", text);
					const result = await createQuestionAction({ ok: true }, fd);
					if (!result.ok) {
						setError(result.error);
						return;
					}
					formRef.current?.reset();
					toast.success("Pregunta aportada.");
					onSuccess?.();
				});
			}}
		>
			<label htmlFor={id} className="sr-only">
				Tu pregunta
			</label>
			<Textarea
				id={id}
				name="text"
				placeholder="¿Qué te hizo pensar?"
				required
				aria-invalid={Boolean(error)}
			/>
			{error ? (
				<p role="alert" className="text-destructive text-xs">
					{error}
				</p>
			) : null}
			<Button type="submit" disabled={pending} className="w-fit">
				Aportar
			</Button>
		</form>
	);
}
