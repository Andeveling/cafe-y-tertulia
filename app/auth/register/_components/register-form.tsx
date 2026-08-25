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
import { register } from "../_lib/register-actions";
import {
	type RegisterValues,
	registerSchema,
} from "../_schemas/register-schema";

const ERRORS = {
	invalid: "Revisá el email, el nombre y la contraseña (mínimo 6).",
	no_invite: "No hay una invitación vigente para ese email.",
	failed: "No pudimos activar tu cuenta. Intentá de nuevo.",
};

export function RegisterForm() {
	const [state, action, pending] = useActionState(register, null);
	const form = useForm<RegisterValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: { email: "", displayName: "", password: "" },
	});

	return (
		<div className="space-y-6">
			<div className="space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">
					Usar mi invitación
				</h1>
				<p className="text-sm text-muted-foreground">
					Si te invitaron al club, activá tu cuenta acá. No hace falta el enlace
					del correo.
				</p>
			</div>

			{state?.error && (
				<div
					role="alert"
					className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
				>
					{ERRORS[state.error]}
				</div>
			)}

			<form
				onSubmit={form.handleSubmit((data) => {
					const fd = new FormData();
					fd.set("email", data.email);
					fd.set("displayName", data.displayName);
					fd.set("password", data.password);
					action(fd);
				})}
				className="space-y-4"
			>
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
								/>
							</FieldContent>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Button type="submit" className="w-full" disabled={pending}>
					{pending ? "Activando…" : "Entrar al club"}
				</Button>
			</form>
		</div>
	);
}
