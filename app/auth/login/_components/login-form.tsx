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
import { signIn } from "@/lib/memberships/actions";

const loginSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Ingresá tu email.")
		.email("El email no parece válido."),
	password: z.string().min(1, "Ingresá tu contraseña."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({ defaultEmail }: { defaultEmail?: string }) {
	const [isPending, startTransition] = useTransition();
	const form = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: defaultEmail ?? "",
			password: "",
		},
	});

	function onSubmit(data: LoginValues) {
		startTransition(async () => {
			const formData = new FormData();
			formData.set("email", data.email);
			formData.set("password", data.password);
			await signIn(formData);
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
			<Controller
				name="password"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
						<FieldContent>
							<Input
								{...field}
								id={field.name}
								type="password"
								autoComplete="current-password"
								aria-invalid={fieldState.invalid}
								placeholder="••••••••"
							/>
						</FieldContent>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Button type="submit" className="w-full" disabled={isPending}>
				{isPending ? "Iniciando…" : "Iniciar sesión"}
			</Button>
		</form>
	);
}
