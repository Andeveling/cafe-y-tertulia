"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export default function InviteAcceptPage() {
	const router = useRouter();
	const supabase = createBrowserClient();
	const [status, setStatus] = useState<
		"loading" | "ready" | "invalid_or_expired" | "update_failed"
	>("loading");

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

	async function handleSubmit(formData: FormData) {
		const password = String(formData.get("password") ?? "");
		const displayName = String(formData.get("displayName") ?? "").trim();

		if (password.length < 6 || !displayName) {
			setStatus("update_failed");
			return;
		}

		const { data: user, error: updateError } = await supabase.auth.updateUser({
			password,
			data: { display_name: displayName },
		});

		if (updateError) {
			setStatus("update_failed");
			return;
		}

		// Activate the membership.
		const { error: memberError } = await supabase
			.from("members")
			.update({ status: "active", display_name: displayName })
			.eq("id", user.user?.id ?? "");

		if (memberError) {
			setStatus("update_failed");
			return;
		}

		// Mark the padrinazgo as accepted.
		await supabase
			.from("invitations")
			.update({ status: "accepted" })
			.eq("email", user.user?.email ?? "")
			.eq("status", "pending");

		router.push("/");
		router.refresh();
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

				<form action={handleSubmit} className="space-y-4">
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
					<Button type="submit" className="w-full">
						Aceptar invitación
					</Button>
				</form>
			</div>
		</div>
	);
}
