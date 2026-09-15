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
import { acceptInvitation } from "../_lib/accept-invitation-actions";
import {
	type AcceptInvitationValues,
	acceptInvitationSchema,
} from "../_schemas/accept-invitation-schema";

export function AcceptInvitationForm({
	email,
	token,
}: {
	email: string;
	token: string;
}) {
	const [formState, formAction, isPending] = useActionState(
		acceptInvitation,
		null,
	);
	const form = useForm<AcceptInvitationValues>({
		resolver: zodResolver(acceptInvitationSchema),
		defaultValues: {
			token,
			email,
			displayName: "",
			password: "",
			confirmPassword: "",
		},
	});

	function onSubmit(data: AcceptInvitationValues) {
		const formData = new FormData();
		formData.set("token", data.token);
		formData.set("email", data.email);
		formData.set("displayName", data.displayName);
		formData.set("password", data.password);
		formData.set("confirmPassword", data.confirmPassword);
		formAction(formData);
	}

	const alert =
		formState?.error === "expired"
			? "Este enlace caducó. Pedile a tu padrino que te reenvíe uno nuevo."
			: formState?.error === "invalid_or_expired"
				? "Este enlace no es válido o ya fue usado. Pedile a tu padrino que te reenvíe la invitación."
				: formState?.error === "update_failed" || formState?.error === "invalid"
					? "No pudimos guardar tus datos. La contraseña debe tener al menos 6 caracteres. Intentá de nuevo."
					: null;

	return (
		<div className="space-y-6">
			<div className="space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">
					Te invitamos al club
				</h1>
				<p className="text-sm text-muted-foreground">
					Elegí tu contraseña y el nombre con el que te va a conocer el club.
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
				<input type="hidden" {...form.register("token")} />
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
									readOnly
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
									placeholder="Tu nombre en el club"
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
					{isPending ? "Guardando…" : "Aceptar invitación"}
				</Button>
			</form>
		</div>
	);
}
