"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
	const router = useRouter();
	const supabase = createBrowserClient();
	const [ready, setReady] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// The recovery link lands here with the session in the URL fragment
		// (#access_token=...&type=recovery). The browser client picks it up and
		// emits PASSWORD_RECOVERY; once that happens the session is usable.
		const { data: sub } = supabase.auth.onAuthStateChange((event) => {
			if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
				setReady(true);
			}
		});
		return () => sub.subscription.unsubscribe();
	}, [supabase]);

	async function handleSubmit(formData: FormData) {
		const password = String(formData.get("password") ?? "");

		if (password.length < 6) {
			setError("La contraseña debe tener al menos 6 caracteres.");
			return;
		}

		// updateUser with the browser session captured from the recovery link.
		const { error: updateError } = await supabase.auth.updateUser({ password });

		if (updateError) {
			setError(
				"El enlace ya no es válido o expiró. Pedí uno nuevo desde el inicio de sesión.",
			);
			return;
		}

		router.push("/auth/login?password_updated=1");
		router.refresh();
	}

	return (
		<div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						Nueva contraseña
					</h1>
					<p className="text-sm text-muted-foreground">
						Elegí una contraseña nueva para tu cuenta.
					</p>
				</div>

				{error && (
					<div
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
					>
						{error}
					</div>
				)}

				<form action={handleSubmit} className="space-y-4">
					<Field>
						<FieldLabel htmlFor="password">Contraseña nueva</FieldLabel>
						<FieldContent>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete="new-password"
								required
								minLength={6}
								placeholder="Mínimo 6 caracteres"
								disabled={!ready}
							/>
						</FieldContent>
					</Field>
					<Button type="submit" className="w-full" disabled={!ready}>
						Cambiar contraseña
					</Button>
				</form>

				{!ready && (
					<p className="text-center text-xs text-muted-foreground">
						Cargando el enlace de recuperación…
					</p>
				)}
			</div>
		</div>
	);
}
