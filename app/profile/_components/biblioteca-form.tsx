"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	createBibliotecaAction,
	updateBibliotecaAction,
} from "@/app/materials/_lib/biblioteca-actions";
import {
	BIBLIOTECA_KINDS,
	type BibliotecaInput,
	bibliotecaInputSchema,
} from "@/app/materials/_lib/biblioteca-schema";
import { MATERIAL_KIND_LABELS } from "@/app/materials/_lib/constants";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type BibliotecaFormValues = z.infer<typeof bibliotecaInputSchema>;

/**
 * Formulario de Biblioteca personal (#88): crea o edita un candidato
 * privado (título, autor, formato, URLs e imagen opcionales, motivo).
 * Comparte esquema con el servidor (`biblioteca-schema`).
 */
export function BibliotecaForm({
	item,
	onSuccess,
}: {
	item?: BibliotecaInput & { id: string };
	onSuccess?: () => void;
}) {
	const [isPending, startTransition] = useTransition();
	const form = useForm<BibliotecaFormValues>({
		resolver: zodResolver(bibliotecaInputSchema),
		defaultValues: {
			title: item?.title ?? "",
			author: item?.author ?? "",
			kind: item?.kind ?? "book",
			imageUrl: item?.imageUrl ?? "",
			sourceUrl: item?.sourceUrl ?? "",
			motive: item?.motive ?? "",
		},
	});

	function onSubmit(data: BibliotecaFormValues) {
		startTransition(async () => {
			const result = item
				? await updateBibliotecaAction(item.id, data)
				: await createBibliotecaAction(data);
			if ("error" in result) {
				toast.error(result.error);
			} else {
				toast.success(item ? "Candidato actualizado" : "Candidato guardado");
				if (!item) form.reset();
				onSuccess?.();
			}
		});
	}

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className="flex flex-col gap-5"
		>
			<FieldGroup>
				<Controller
					name="title"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor={field.name}>Título</FieldLabel>
							<Input
								{...field}
								id={field.name}
								placeholder="El nombre del viento"
								aria-invalid={fieldState.invalid}
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>

				<Controller
					name="author"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor={field.name}>Autor</FieldLabel>
							<Input
								{...field}
								id={field.name}
								placeholder="Patrick Rothfuss"
								aria-invalid={fieldState.invalid}
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>

				<Controller
					name="kind"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor={field.name}>Formato</FieldLabel>
							<Select
								name={field.name}
								value={field.value}
								onValueChange={field.onChange}
							>
								<SelectTrigger
									id={field.name}
									className="w-full"
									aria-invalid={fieldState.invalid}
								>
									<SelectValue placeholder="Selecciona un formato">
										{(value: string | null) =>
											value
												? MATERIAL_KIND_LABELS[
														value as (typeof BIBLIOTECA_KINDS)[number]
													]
												: null
										}
									</SelectValue>
								</SelectTrigger>
								<SelectContent alignItemWithTrigger={false}>
									<SelectGroup>
										{BIBLIOTECA_KINDS.map((option) => (
											<SelectItem key={option} value={option}>
												{MATERIAL_KIND_LABELS[option]}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>

				<Controller
					name="sourceUrl"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor={field.name}>Fuente (opcional)</FieldLabel>
							<Input
								{...field}
								value={field.value ?? ""}
								id={field.name}
								inputMode="url"
								placeholder="https://…"
								aria-invalid={fieldState.invalid}
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>

				<Controller
					name="imageUrl"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor={field.name}>Imagen (opcional)</FieldLabel>
							<Input
								{...field}
								value={field.value ?? ""}
								id={field.name}
								inputMode="url"
								placeholder="https://…"
								aria-invalid={fieldState.invalid}
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>

				<Controller
					name="motive"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor={field.name}>Motivo (opcional)</FieldLabel>
							<Textarea
								{...field}
								value={field.value ?? ""}
								id={field.name}
								placeholder="Por qué lo guardas…"
								aria-invalid={fieldState.invalid}
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
			</FieldGroup>

			<Button type="submit" disabled={isPending}>
				<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
				{item ? "Guardar cambios" : "Guardar en mi biblioteca"}
			</Button>
		</form>
	);
}
