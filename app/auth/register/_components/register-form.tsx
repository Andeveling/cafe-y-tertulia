"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState } from "react";
import { type Control, Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type RegisterState, signUp } from "../_lib/register-actions";
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

	const alertContent = getAlertContent(formState, loginHref);

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

			{alertContent && (
				<div
					role="alert"
					className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
				>
					{alertContent}
				</div>
			)}

			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<input type="hidden" {...form.register("next")} />
				<RegisterField
					control={form.control}
					name="email"
					label="Email"
					type="email"
					autoComplete="email"
					placeholder="tucorreo@ejemplo.com"
				/>
				<RegisterField
					control={form.control}
					name="displayName"
					label="Nombre visible"
					type="text"
					autoComplete="nickname"
					placeholder="Tu nombre en la plataforma"
				/>
				<RegisterField
					control={form.control}
					name="password"
					label="Contraseña"
					type="password"
					autoComplete="new-password"
					placeholder="Mínimo 6 caracteres"
				/>
				<RegisterField
					control={form.control}
					name="confirmPassword"
					label="Confirmar contraseña"
					type="password"
					autoComplete="new-password"
					placeholder="Repetí la contraseña"
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

function getAlertContent(state: RegisterState, loginHref: string) {
	if (!state) return null;
	if (state.error === "taken") {
		return (
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
		);
	}
	if (state.error === "failed") {
		return "No pudimos crear tu cuenta. Intentá de nuevo.";
	}
	return "Revisá los datos: email válido, nombre de al menos 2 letras y contraseña de al menos 6 caracteres.";
}

function RegisterField({
	control,
	name,
	label,
	type,
	autoComplete,
	placeholder,
}: {
	control: Control<RegisterValues>;
	name: "email" | "displayName" | "password" | "confirmPassword";
	label: string;
	type: string;
	autoComplete: string;
	placeholder: string;
}) {
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={name}>{label}</FieldLabel>
					<FieldContent>
						<Input
							{...field}
							id={name}
							type={type}
							autoComplete={autoComplete}
							aria-invalid={fieldState.invalid}
							placeholder={placeholder}
						/>
					</FieldContent>
					{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
				</Field>
			)}
		/>
	);
}
