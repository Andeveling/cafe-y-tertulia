"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { createClient as createBrowserClient } from "@/lib/supabase/client";

const updatePasswordSchema = z.object({
	password: z
		.string()
		.min(6, "La contraseña debe tener al menos 6 caracteres."),
});

type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
	const router = useRouter();
	const supabase = createBrowserClient();
	const [ready, setReady] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const form = useForm<UpdatePasswordValues>({
		resolver: zodResolver(updatePasswordSchema),
		defaultValues: {
			password: "",
		},
	});

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

	async function onSubmit(data: UpdatePasswordValues) {
		// updateUser with the browser session captured from the recovery link.
		const { error: updateError } = await supabase.auth.updateUser({
			password: data.password,
		});

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

				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<Controller
						name="password"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={field.name}>Contraseña nueva</FieldLabel>
								<FieldContent>
									<Input
										{...field}
										id={field.name}
										type="password"
										autoComplete="new-password"
										aria-invalid={fieldState.invalid}
										placeholder="Mínimo 6 caracteres"
										disabled={!ready}
									/>
								</FieldContent>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
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
