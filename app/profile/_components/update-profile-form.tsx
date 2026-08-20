"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
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
	const [isPending, startTransition] = useTransition();
	const form = useForm<UpdateProfileValues>({
		resolver: zodResolver(updateProfileSchema),
		defaultValues: {
			displayName: defaultDisplayName,
		},
	});

	function onSubmit(data: UpdateProfileValues) {
		startTransition(async () => {
			const formData = new FormData();
			formData.set("displayName", data.displayName);
			await updateProfile(formData);
		});
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
			<Button type="submit" className="self-start" disabled={isPending}>
				{isPending ? "Guardando…" : "Guardar"}
			</Button>
		</form>
	);
}
