"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createSession } from "@/app/materials/_lib/materials-actions";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const sessionFormSchema = z.object({
	range: z.string().trim().min(1, "El rango no puede estar vacío."),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

export function SessionForm({ materialId }: { materialId: string }) {
	const [isPending, startTransition] = useTransition();
	const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
	const form = useForm<SessionFormValues>({
		resolver: zodResolver(sessionFormSchema),
		defaultValues: {
			range: "",
		},
	});

	function onSubmit(data: SessionFormValues) {
		startTransition(async () => {
			const result = await createSession({
				materialId,
				range: data.range,
				scheduledAt: scheduledAt?.toISOString() ?? null,
			});
			if ("error" in result) {
				toast.error(result.error);
			} else {
				toast.success("Sesión creada");
				form.reset();
				setScheduledAt(undefined);
			}
		});
	}

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className="flex items-end gap-2"
		>
			<Controller
				name="range"
				control={form.control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid} className="w-56">
						<FieldLabel htmlFor="session-range">Rango cubierto</FieldLabel>
						<Input
							{...field}
							id="session-range"
							placeholder='Ej. "Capítulos 1-3"'
							aria-invalid={fieldState.invalid}
						/>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
			<Field className="w-48">
				<FieldLabel htmlFor="session-scheduled-at">Fecha programada</FieldLabel>
				<DatePicker
					date={scheduledAt}
					onSelect={setScheduledAt}
					placeholder="Sin fecha"
					id="session-scheduled-at"
				/>
			</Field>
			<Button type="submit" disabled={isPending}>
				<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
				Nueva sesión
			</Button>
		</form>
	);
}
