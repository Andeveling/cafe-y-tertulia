"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useState } from "react";
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
import {
	type AcceptInvitationState,
	acceptInvitation,
} from "@/lib/memberships/actions";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

const acceptInvitationSchema = z.object({
	displayName: z
		.string()
		.trim()
		.min(1, "Elegí un nombre visible.")
		.max(60, "El nombre no puede superar los 60 caracteres."),
	password: z
		.string()
		.min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;

export default function InviteAcceptPage() {
	const supabase = createBrowserClient();
	const [status, setStatus] = useState<
		"loading" | "ready" | "invalid_or_expired" | "update_failed"
	>("loading");
	const [formState, formAction, isPending] = useActionState(
		acceptInvitation,
		null,
	);
	const form = useForm<AcceptInvitationValues>({
		resolver: zodResolver(acceptInvitationSchema),
		defaultValues: {
			displayName: "",
			password: "",
		},
	});

	useEffect(() => {
		// The invite email link lands here with the session in the URL fragment
		// (access_token + type=invite). Let the browser client pick it up.
		supabase.auth
			.getSession()
			.then(({ data }) => {
				setStatus(data.session ? "ready" : "invalid_or_expired");
			})
			.catch(() => setStatus("invalid_or_expired"));
	}, [supabase]);

	useEffect(() => {
		if (formState?.error) {
			setStatus(
				formState.error === "invalid_or_expired"
					? "invalid_or_expired"
					: "update_failed",
			);
		}
	}, [formState]);

	function onSubmit(data: AcceptInvitationValues) {
		const formData = new FormData();
		formData.set("displayName", data.displayName);
		formData.set("password", data.password);
		formAction(formData);
	}

	if (status === "loading") {
		return (
			<div className="flex min-h-full flex-1 items-center justify-center px-4">
				<p className="text-sm text-muted-foreground">Cargando invitación…</p>
			</div>
		);
	}

	if (status === "invalid_or_expired") {
		return (
			<div className="flex min-h-full flex-1 items-center justify-center px-4">
				<div className="w-full max-w-sm space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						Invitación no válida
					</h1>
					<p className="text-sm text-muted-foreground">
						Este enlace de invitación no es válido o ya fue usado. Pedile a tu
						padrino que te reenvíe la invitación.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
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
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
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
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Guardando…" : "Aceptar invitación"}
					</Button>
				</form>
			</div>
		</div>
	);
}
