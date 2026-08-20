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
import { useInviteSession } from "../_hooks/use-invite-session";
import { acceptInvitation } from "../_lib/actions";
import {
	type AcceptInvitationValues,
	acceptInvitationSchema,
} from "../_schemas/accept-invitation-schema";

export function AcceptInvitationForm() {
	const [formState, formAction, isPending] = useActionState(
		acceptInvitation,
		null,
	);
	const status = useInviteSession(formState);
	const form = useForm<AcceptInvitationValues>({
		resolver: zodResolver(acceptInvitationSchema),
		defaultValues: {
			displayName: "",
			password: "",
		},
	});

	function onSubmit(data: AcceptInvitationValues) {
		const formData = new FormData();
		formData.set("displayName", data.displayName);
		formData.set("password", data.password);
		formAction(formData);
	}

	if (status === "loading") {
		return (
			<p className="text-center text-sm text-muted-foreground">
				Cargando invitación…
			</p>
		);
	}

	if (status === "invalid_or_expired") {
		return (
			<div className="space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">
					Invitación no válida
				</h1>
				<p className="text-sm text-muted-foreground">
					Este enlace de invitación no es válido o ya fue usado. Pedile a tu
					padrino que te reenvíe la invitación.
				</p>
			</div>
		);
	}

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

			{status === "update_failed" && (
				<div
					role="alert"
					className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
				>
					No pudimos guardar tus datos. La contraseña debe tener al menos 6
					caracteres. Intentá de nuevo.
				</div>
			)}

			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
				<Button type="submit" className="w-full" disabled={isPending}>
					{isPending ? "Guardando…" : "Aceptar invitación"}
				</Button>
			</form>
		</div>
	);
}
