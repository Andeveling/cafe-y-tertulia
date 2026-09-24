"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUp } from "../_lib/register-actions";
import {
	type RegisterValues,
	registerSchema,
} from "../_schemas/register-schema";

export function RegisterForm({
	defaultEmail,
	next,
	loginHref,
}: {
	defaultEmail?: string;
	next: string;
	loginHref: string;
}) {
	const [formState, formAction, isPending] = useActionState(signUp, null);
	const form = useForm<RegisterValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			email: defaultEmail ?? "",
			displayName: "",
			password: "",
			confirmPassword: "",
			next,
		},
	});

	function onSubmit(data: RegisterValues) {
		const formData = new FormData();
		formData.set("email", data.email);
		formData.set("displayName", data.displayName);
		formData.set("password", data.password);
		formData.set("confirmPassword", data.confirmPassword);
		formData.set("next", data.next ?? next);
		formAction(formData);
	}

	const alert =
		formState?.error === "taken" ? (
			<>
				Ese email ya tiene cuenta.{" "}
				<a
					href={loginHref}
					className="font-medium text-primary underline underline-offset-4"
				>
					Iniciá sesión
				</a>{" "}
				en vez de crear un duplicado.
			</>
		) : formState?.error === "failed" ? (
			"No pudimos crear tu cuenta. Intentá de nuevo."
		) : formState?.error === "invalid" ? (
			"Revisá los datos: email válido, nombre de al menos 2 letras y contraseña de al menos 6 caracteres."
		) : null;

	return (
		<div className="space-y-6">
			<div className="space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">
					Creá tu cuenta
				</h1>
				<p className="text-sm text-muted-foreground">
					Entrás a la plataforma sin padrino. Invitar a un Grupo privado es otra
					cosa y lo hace su Administrador.
				</p>
			</div>

			{alert && (
				<div
					role="alert"
					className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
				>
					{alert}
				</div>
			)}

			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<input type="hidden" {...form.register("next")} />
				<Controller
					name="email"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="email">Email</FieldLabel>
							<FieldContent>
								<Input
									{...field}
									id="email"
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
					name="displayName"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="displayName">Nombre visible</FieldLabel>
							<FieldContent>
								<Input
									{...field}
									id="displayName"
									type="text"
									autoComplete="nickname"
									aria-invalid={fieldState.invalid}
									placeholder="Tu nombre en la plataforma"
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
							<FieldLabel htmlFor="password">Contraseña</FieldLabel>
							<FieldContent>
								<Input
									{...field}
									id="password"
									type="password"
									autoComplete="new-password"
									aria-invalid={fieldState.invalid}
									placeholder="Mínimo 6 caracteres"
								/>
							</FieldContent>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name="confirmPassword"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="confirmPassword">
								Confirmar contraseña
							</FieldLabel>
							<FieldContent>
								<Input
									{...field}
									id="confirmPassword"
									type="password"
									autoComplete="new-password"
									aria-invalid={fieldState.invalid}
									placeholder="Repetí la contraseña"
								/>
							</FieldContent>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Button type="submit" className="w-full" disabled={isPending}>
					{isPending ? "Creando…" : "Crear cuenta"}
				</Button>
			</form>

			<p className="text-center text-sm text-muted-foreground">
				¿Ya tenés cuenta?{" "}
				<a
					href={loginHref}
					className="font-medium text-primary underline underline-offset-4"
				>
					Iniciá sesión
				</a>
			</p>
		</div>
	);
}
