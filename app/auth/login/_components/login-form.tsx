"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "../_lib/login-actions";
import { LoginValues, loginSchema } from "../_schemas/login-schema";

export function LoginForm({
	defaultEmail,
	next,
}: {
	defaultEmail?: string;
	next: string;
}) {
	const [isPending, startTransition] = useTransition();
	const [showPassword, setShowPassword] = useState(false);
	const { control, handleSubmit } = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: defaultEmail ?? "",
			password: "",
		},
	});

	const onSubmit = handleSubmit(async (data) => {
		startTransition(async () => {
			const formData = new FormData();
			formData.set("email", data.email);
			formData.set("password", data.password);
			formData.set("next", next);
			await signIn(formData);
		});
	});

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<input type="hidden" name="next" value={next} />
			<Controller
				name="email"
				control={control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor={field.name}>Email</FieldLabel>
						<FieldContent>
							<Input
								{...field}
								id={field.name}
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
				name="password"
				control={control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
						<FieldContent>
							<div className="relative">
								<Input
									{...field}
									id={field.name}
									type={showPassword ? "text" : "password"}
									autoComplete="current-password"
									aria-invalid={fieldState.invalid}
									placeholder="••••••••"
									className="pr-9"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									aria-label={
										showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
									}
									aria-pressed={showPassword}
									className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
								>
									<HugeiconsIcon
										icon={showPassword ? ViewOffIcon : ViewIcon}
										className="size-4"
									/>
								</button>
							</div>
						</FieldContent>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Button type="submit" className="w-full" disabled={isPending}>
				{isPending ? "Iniciando…" : "Iniciar sesión"}
			</Button>
		</form>
	);
}
