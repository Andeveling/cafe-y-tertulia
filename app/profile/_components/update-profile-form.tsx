"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState } from "react";
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
import { updateProfile } from "../_lib/profile-actions";

const updateProfileSchema = z.object({
	displayName: z
		.string()
		.trim()
		.min(1, "El nombre no puede estar vacío.")
		.max(60, "El nombre no puede superar los 60 caracteres."),
});

type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

export function UpdateProfileForm({
	defaultDisplayName,
}: {
	defaultDisplayName: string;
}) {
	const [formState, formAction, isPending] = useActionState(
		updateProfile,
		null,
	);
	const form = useForm<UpdateProfileValues>({
		resolver: zodResolver(updateProfileSchema),
		defaultValues: {
			displayName: defaultDisplayName,
		},
	});

	function onSubmit(data: UpdateProfileValues) {
		const formData = new FormData();
		formData.set("displayName", data.displayName);
		formAction(formData);
	}

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className="flex flex-col gap-4"
		>
			<Controller
				name="displayName"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
						<FieldContent>
							<Input
								{...field}
								id={field.name}
								type="text"
								autoComplete="nickname"
								aria-invalid={fieldState.invalid}
							/>
						</FieldContent>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			{formState && "error" in formState ? (
				<p role="alert" className="text-sm text-destructive">
					No pudimos guardar los cambios. Intentá de nuevo.
				</p>
			) : null}
			{formState && "ok" in formState ? (
				<p role="status" className="text-sm text-muted-foreground">
					Perfil actualizado. El club ya te ve así.
				</p>
			) : null}
			<Button
				type="submit"
				className="min-h-11 self-start"
				disabled={isPending}
			>
				{isPending ? "Guardando…" : "Guardar"}
			</Button>
		</form>
	);
}
