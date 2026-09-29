"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createSession } from "@/app/materials/_lib/materials-actions";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";

const schema = z
	.object({
		label: z.string().optional(),
		materialMode: z.string(),
		range: z.string().optional(),
		mode: z.enum(["now", "scheduled"]),
		scheduledAt: z.date().optional(),
	})
	.refine((d) => d.mode !== "scheduled" || d.scheduledAt !== undefined, {
		message: "La fecha es obligatoria.",
		path: ["scheduledAt"],
	});

type Values = z.infer<typeof schema>;

export function SessionCreateDialog({
	trigger,
	materials,
	displayName,
	groupId,
	initialMode = "now",
}: {
	trigger: React.ReactElement;
	materials: { id: string; title: string }[];
	displayName: string;
	groupId: string;
	initialMode?: "now" | "scheduled";
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [pending, startTransition] = useTransition();
	const [mode, setMode] = useState<"now" | "scheduled">(initialMode);
	const uid = useId();
	const ids = {
		label: `${uid}-label`,
		materialMode: `${uid}-materialMode`,
		range: `${uid}-range`,
		scheduledAt: `${uid}-scheduledAt`,
	};

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: {
			label: "",
			materialMode: "none",
			range: "",
			mode: initialMode,
		},
	});
	const materialMode = form.watch("materialMode");
	const hasMaterial = materialMode !== "none";

	function selectMode(next: "now" | "scheduled") {
		setMode(next);
		form.setValue("mode", next);
	}

	function onSubmit(data: Values) {
		startTransition(async () => {
			const payload: Parameters<typeof createSession>[0] = {
				groupId,
				range: data.label?.trim() || undefined,
				scheduledAt:
					data.mode === "scheduled" && data.scheduledAt
						? data.scheduledAt.toISOString()
						: undefined,
			};
			if (data.materialMode !== "none") {
				payload.materialId = data.materialMode;
				payload.range = data.range?.trim() || undefined;
			}
			const result = await createSession(payload);
			if ("error" in result) {
				toast.error(result.error);
				return;
			}
			setOpen(false);
			form.reset();
			if (data.mode === "now" && "sessionId" in result && result.sessionId) {
				router.push(`/materials/sessions/${result.sessionId}/room`);
			} else {
				toast.success("Sesión creada");
			}
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={trigger} />
			<DialogContent className="max-h-[90vh] overflow-auto">
				<DialogHeader>
					<DialogTitle>Nueva sesión</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-4"
				>
					<FieldGroup>
						<Controller
							name="label"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel htmlFor={ids.label}>Etiqueta</FieldLabel>
									<Input
										{...field}
										id={ids.label}
										placeholder={`Sesión de ${displayName}`}
									/>
								</Field>
							)}
						/>
						<Controller
							name="materialMode"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel htmlFor={ids.materialMode}>Material</FieldLabel>
									<NativeSelect
										{...field}
										id={ids.materialMode}
										onChange={(e) => {
											field.onChange(e);
											form.setValue("range", "");
										}}
									>
										<NativeSelectOption value="none">
											Sin material
										</NativeSelectOption>
										{materials.map((m) => (
											<NativeSelectOption key={m.id} value={m.id}>
												{m.title}
											</NativeSelectOption>
										))}
									</NativeSelect>
								</Field>
							)}
						/>
						{hasMaterial && (
							<Controller
								name="range"
								control={form.control}
								render={({ field }) => (
									<Field>
										<FieldLabel htmlFor={ids.range}>Rango</FieldLabel>
										<Input {...field} id={ids.range} placeholder="Cap. 1–5" />
									</Field>
								)}
							/>
						)}
					</FieldGroup>
					<div className="flex items-end gap-3">
						<div className="flex gap-2" role="group" aria-label="Cuándo">
							<Button
								type="button"
								variant={mode === "now" ? "default" : "outline"}
								size="sm"
								aria-pressed={mode === "now"}
								onClick={() => selectMode("now")}
							>
								Ahora
							</Button>
							<Button
								type="button"
								variant={mode === "scheduled" ? "default" : "outline"}
								size="sm"
								aria-pressed={mode === "scheduled"}
								onClick={() => selectMode("scheduled")}
							>
								Programar
							</Button>
						</div>
						{mode === "scheduled" && (
							<Controller
								name="scheduledAt"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor={ids.scheduledAt}>Fecha</FieldLabel>
										<DatePicker
											id={ids.scheduledAt}
											date={field.value}
											onSelect={field.onChange}
											placeholder="Fecha"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						)}
					</div>
					<Button type="submit" disabled={pending} className="w-fit">
						Crear
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
