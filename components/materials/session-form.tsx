"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTransition } from "react";
import { toast } from "sonner";
import { createSession } from "@/app/materiales/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SessionForm({ materialId }: { materialId: string }) {
	const [isPending, startTransition] = useTransition();

	return (
		<form
			className="flex items-end gap-2"
			action={(formData) => {
				const range = String(formData.get("range") ?? "").trim();
				if (!range) {
					toast.error("El rango no puede estar vacío");
					return;
				}
				startTransition(async () => {
					const result = await createSession({ materialId, range });
					if ("error" in result) {
						toast.error(result.error);
					} else {
						toast.success("Sesión creada");
					}
				});
			}}
		>
			<Field className="w-56">
				<FieldLabel htmlFor="session-range">Rango cubierto</FieldLabel>
				<Input
					id="session-range"
					name="range"
					placeholder='Ej. "Capítulos 1-3"'
				/>
			</Field>
			<Button type="submit" size="sm" disabled={isPending}>
				<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
				Nueva sesión
			</Button>
		</form>
	);
}
