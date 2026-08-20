"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/memberships/actions";

const resetSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Ingresá tu email.")
		.email("El email no parece válido."),
});

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordForm() {
	const [isPending, startTransition] = useTransition();
	const form = useForm<ResetValues>({
		resolver: zodResolver(resetSchema),
		defaultValues: {
			email: "",
		},
	});

	function onSubmit(data: ResetValues) {
		startTransition(async () => {
			const formData = new FormData();
			formData.set("email", data.email);
			await requestPasswordReset(formData);
		});
	}

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
			<Controller
				name="email"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor={field.name}>Email</FieldLabel>
						<FieldContent>
							<Input
								{...field}
								id={field.name}
								type="email"
								autoComplete="email"
								aria-invalid={fieldState.invalid}
								placeholder="tucorreo@ejemplo.com"
							/>
						</FieldContent>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Button type="submit" className="w-full" disabled={isPending}>
				{isPending ? "Enviando…" : "Enviar enlace"}
			</Button>
		</form>
	);
}
