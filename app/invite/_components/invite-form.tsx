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
import { invite } from "@/lib/memberships/actions";

const inviteSchema = z.object({
	email: z.email("Ese email no parece válido."),
});

type InviteValues = z.infer<typeof inviteSchema>;

export function InviteForm() {
	const [isPending, startTransition] = useTransition();
	const form = useForm<InviteValues>({
		resolver: zodResolver(inviteSchema),
		defaultValues: {
			email: "",
		},
	});

	function onSubmit(data: InviteValues) {
		startTransition(async () => {
			const formData = new FormData();
			formData.set("email", data.email);
			await invite(formData);
		});
	}

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className="flex flex-col gap-4 sm:flex-row"
		>
			<Controller
				name="email"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid} className="flex-1">
						<FieldLabel htmlFor={field.name} className="sr-only">
							Email
						</FieldLabel>
						<FieldContent>
							<Input
								{...field}
								id={field.name}
								type="email"
								autoComplete="off"
								aria-invalid={fieldState.invalid}
								placeholder="correo@ejemplo.com"
							/>
						</FieldContent>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Button type="submit" disabled={isPending}>
				{isPending ? "Enviando…" : "Enviar invitación"}
			</Button>
		</form>
	);
}
