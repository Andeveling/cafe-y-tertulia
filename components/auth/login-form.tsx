"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { signIn } from "@/app/auth/login/actions";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm() {
	const [isPending, startTransition] = useTransition();

	return (
		<form
			action={(formData) => {
				const email = String(formData.get("email") ?? "").trim();
				const password = String(formData.get("password") ?? "");

				if (!email || !password) {
					toast.error("Ingresa tu email y contraseña");
					return;
				}

				startTransition(async () => {
					const result = await signIn({ email, password });
					if ("error" in result) {
						toast.error(result.error);
					}
				});
			}}
			className="flex flex-col gap-5"
		>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="tucorreo@ejemplo.com"
						autoComplete="email"
						required
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="password">Contraseña</FieldLabel>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete="current-password"
						required
					/>
					<FieldError />
				</Field>
			</FieldGroup>

			<Button type="submit" disabled={isPending}>
				{isPending ? "Ingresando…" : "Ingresar"}
			</Button>
		</form>
	);
}
