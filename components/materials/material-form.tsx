"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTransition } from "react";
import { toast } from "sonner";
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

const KIND_OPTIONS = [
	{ value: "book", label: "Libro" },
	{ value: "podcast", label: "Podcast" },
	{ value: "video", label: "Video" },
	{ value: "article", label: "Artículo" },
] as const;

export function MaterialForm() {
	const [isPending, startTransition] = useTransition();

	return (
		<form
			action={(formData) => {
				const title = String(formData.get("title") ?? "").trim();
				const author = String(formData.get("author") ?? "").trim();
				const kind = String(formData.get("kind") ?? "");

				if (!title || !author || !kind) {
					toast.error("Completa todos los campos");
					return;
				}

				startTransition(async () => {
					const result = await createMaterial({
						title,
						author,
						kind: kind as (typeof KIND_OPTIONS)[number]["value"],
					});
					if ("error" in result) {
						toast.error(result.error);
					} else {
						toast.success("Material propuesto");
					}
				});
			}}
			className="flex flex-col gap-5"
		>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="title">Título</FieldLabel>
					<Input id="title" name="title" placeholder="El Quijote" required />
				</Field>

				<Field>
					<FieldLabel htmlFor="author">Autor</FieldLabel>
					<Input
						id="author"
						name="author"
						placeholder="Miguel de Cervantes"
						required
					/>
				</Field>

				<Field>
					<FieldLabel htmlFor="kind">Tipo</FieldLabel>
					<Select name="kind" defaultValue="book">
						<SelectTrigger id="kind" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{KIND_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					<FieldError />
				</Field>
			</FieldGroup>

			<Button type="submit" disabled={isPending}>
				<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
				Proponer material
			</Button>
		</form>
	);
}
