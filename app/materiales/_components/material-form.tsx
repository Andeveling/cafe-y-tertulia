"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createMaterial } from "@/app/materiales/actions";
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
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

export function MaterialForm() {
	const [isPending, startTransition] = useTransition();
	const form = useForm<MaterialFormValues>({
		resolver: zodResolver(materialFormSchema),
		defaultValues: {
			title: "",
			author: "",
			kind: "book",
		},
	});

	function onSubmit(data: MaterialFormValues) {
		startTransition(async () => {
			const result = await createMaterial(data);
			if ("error" in result) {
				toast.error(result.error);
			} else {
				toast.success("Material propuesto");
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
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
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
			</FieldGroup>

			<Button type="submit" disabled={isPending}>
				<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
				Proponer material
			</Button>
		</form>
	);
}
