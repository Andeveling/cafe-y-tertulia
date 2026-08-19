"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	type AcceptInvitationState,
	acceptInvitation,
} from "@/lib/memberships/actions";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export default function InviteAcceptPage() {
	const supabase = createBrowserClient();
	const [status, setStatus] = useState<
		"loading" | "ready" | "invalid_or_expired" | "update_failed"
	>("loading");
	const [formState, formAction, isPending] = useActionState(
		acceptInvitation,
		null,
	);

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

				<form action={formAction} className="space-y-4">
					<Field>
						<FieldLabel htmlFor="displayName">Nombre visible</FieldLabel>
						<FieldContent>
							<Input
								id="displayName"
								name="displayName"
								type="text"
								autoComplete="nickname"
								required
								maxLength={60}
								placeholder="Tu nombre en el club"
							/>
						</FieldContent>
					</Field>
					<Field>
						<FieldLabel htmlFor="password">Contraseña</FieldLabel>
						<FieldContent>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete="new-password"
								required
								minLength={6}
								placeholder="Mínimo 6 caracteres"
							/>
						</FieldContent>
					</Field>
					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Guardando…" : "Aceptar invitación"}
					</Button>
				</form>
			</div>
		</div>
	);
}
