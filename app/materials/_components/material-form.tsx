"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	ClapperboardIcon,
	FeatherIcon,
	Idea01Icon,
	LandmarkIcon,
	NewspaperIcon,
	PlusSignIcon,
	Tag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { Category } from "@/app/materials/_lib/categories";
import { optionalHttpsUrl } from "@/app/materials/_lib/material-urls";
import { createMaterial } from "@/app/materials/_lib/materials-actions";
import { Badge } from "@/components/ui/badge";
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

const CATEGORY_ICON: Record<string, typeof Idea01Icon> = {
	filosofia: Idea01Icon,
	cine: ClapperboardIcon,
	actualidad: NewspaperIcon,
	poesia: FeatherIcon,
	historia: LandmarkIcon,
};

const MATERIAL_KIND_OPTIONS = ["book", "podcast", "video", "article"] as const;

const MATERIAL_KIND_LABELS: Record<
	(typeof MATERIAL_KIND_OPTIONS)[number],
	string
> = {
	book: "Libro",
	podcast: "Podcast",
	video: "Video",
	article: "Artículo",
};

const materialFormSchema = z.object({
	title: z.string().trim().min(1, "El título es obligatorio."),
	author: z.string().trim().min(1, "El autor es obligatorio."),
	kind: z.enum(MATERIAL_KIND_OPTIONS),
	imageUrl: optionalHttpsUrl("La imagen").optional(),
	sourceUrl: optionalHttpsUrl("La fuente").optional(),
	categoryIds: z.array(z.string()).optional(),
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

export function MaterialForm({
	groupId,
	slug,
	categories,
	onSuccess,
}: {
	groupId: string;
	slug: string;
	categories?: Category[];
	onSuccess?: () => void;
}) {
	const [isPending, startTransition] = useTransition();
	const form = useForm<MaterialFormValues>({
		resolver: zodResolver(materialFormSchema),
		defaultValues: {
			title: "",
			author: "",
			kind: "book",
			imageUrl: "",
			sourceUrl: "",
		},
	});

	function onSubmit(data: MaterialFormValues) {
		startTransition(async () => {
			const result = await createMaterial({
				title: data.title,
				kind: data.kind,
				author: data.author,
				imageUrl: data.imageUrl,
				sourceUrl: data.sourceUrl,
				categoryIds: data.categoryIds ?? [],
				groupId,
				slug,
			});
			if ("error" in result) {
				toast.error(result.error);
			} else {
				toast.success("Material propuesto");
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
								placeholder="El Quijote"
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
								placeholder="Miguel de Cervantes"
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
							<FieldLabel htmlFor={field.name}>Tipo</FieldLabel>
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
									<SelectValue placeholder="Selecciona un tipo">
										{(value: string | null) =>
											value
												? MATERIAL_KIND_LABELS[
														value as (typeof MATERIAL_KIND_OPTIONS)[number]
													]
												: null
										}
									</SelectValue>
								</SelectTrigger>
								<SelectContent alignItemWithTrigger={false}>
									<SelectGroup>
										{MATERIAL_KIND_OPTIONS.map((option) => (
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
			</FieldGroup>

			{categories && categories.length > 0 && (
				<Controller
					name="categoryIds"
					control={form.control}
					render={({ field }) => (
						<Field>
							<FieldLabel>Categorías</FieldLabel>
							<div
								className="flex flex-wrap gap-2"
								role="group"
								aria-label="Categorías del material"
							>
								{categories.map((c) => {
									const picked = field.value ?? [];
									const on = picked.includes(c.id);
									return (
										<button
											key={c.id}
											type="button"
											onClick={() => {
												const current = field.value ?? [];
												const next = on
													? current.filter((id: string) => id !== c.id)
													: [...current, c.id];
												field.onChange(next);
											}}
											aria-pressed={on}
										>
											<Badge variant={on ? "default" : "outline"}>
												<HugeiconsIcon
													icon={CATEGORY_ICON[c.key] ?? Tag01Icon}
													size={14}
													data-icon="inline-start"
												/>{" "}
												{c.name}
											</Badge>
										</button>
									);
								})}
							</div>
						</Field>
					)}
				/>
			)}

			<Button type="submit" disabled={isPending}>
				<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
				Proponer material
			</Button>
		</form>
	);
}
