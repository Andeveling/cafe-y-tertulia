"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const KINDS = ["book", "podcast", "video", "article"] as const;
const KIND_LABELS: Record<(typeof KINDS)[number], string> = {
	book: "Libro",
	podcast: "Podcast",
	video: "Video",
	article: "Artículo",
};

const schema = z
	.object({
		label: z.string().optional(),
		materialMode: z.string(),
		existingMaterialId: z.string().optional(),
		newTitle: z.string().optional(),
		newAuthor: z.string().optional(),
		newKind: z.enum(KINDS).optional(),
		range: z.string().optional(),
		mode: z.enum(["now", "scheduled"]),
		scheduledAt: z.date().optional(),
	})
	.refine((d) => d.mode !== "scheduled" || d.scheduledAt !== undefined, {
		message: "La fecha es obligatoria.",
		path: ["scheduledAt"],
	})
	.refine(
		(d) =>
			d.materialMode !== "new" || (d.newTitle?.trim() && d.newAuthor?.trim()),
		{
			message: "Título y autor son obligatorios.",
			path: ["newTitle"],
		},
	);

type Values = z.infer<typeof schema>;

export function SessionCreateDialog({
	trigger,
	materials,
	displayName,
	initialMode = "now",
}: {
	trigger: React.ReactElement;
	materials: { id: string; title: string }[];
	displayName: string;
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
		newTitle: `${uid}-newTitle`,
		newAuthor: `${uid}-newAuthor`,
		newKind: `${uid}-newKind`,
		scheduledAt: `${uid}-scheduledAt`,
	};

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: {
			label: "",
			materialMode: "none",
			existingMaterialId: "",
			newTitle: "",
			newAuthor: "",
			newKind: "book",
			range: "",
			mode: initialMode,
		},
	});
	const materialMode = form.watch("materialMode");
	const materialError = form.formState.errors.newTitle;

	function onSubmit(data: Values) {
		startTransition(async () => {
			const payload: Parameters<typeof createSession>[0] = {
				range: data.label?.trim() || undefined,
				scheduledAt:
					data.mode === "scheduled" && data.scheduledAt
						? data.scheduledAt.toISOString()
						: undefined,
			};
			if (data.materialMode !== "none" && data.materialMode !== "new") {
				payload.materialId = data.materialMode;
				payload.range = data.range?.trim() || undefined;
			} else if (data.materialMode === "new") {
				payload.material = {
					title: data.newTitle!.trim(),
					author: data.newAuthor!.trim(),
					kind: data.newKind ?? "book",
				};
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
										<NativeSelectOption value="new">Nuevo</NativeSelectOption>
									</NativeSelect>
								</Field>
							)}
						/>
						{materialMode !== "none" && materialMode !== "new" && (
							<>
								<input
									type="hidden"
									{...form.register("existingMaterialId")}
									value={materialMode}
								/>
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
							</>
						)}
						{materialMode === "new" && (
							<>
								<Controller
									name="newTitle"
									control={form.control}
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor={ids.newTitle}>Título</FieldLabel>
											<Input
												{...field}
												id={ids.newTitle}
												placeholder="El Quijote"
												aria-invalid={fieldState.invalid}
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
								<Controller
									name="newAuthor"
									control={form.control}
									render={({ field }) => (
										<Field>
											<FieldLabel htmlFor={ids.newAuthor}>Autor</FieldLabel>
											<Input
												{...field}
												id={ids.newAuthor}
												placeholder="Miguel de Cervantes"
												aria-invalid={materialError ? true : undefined}
											/>
										</Field>
									)}
								/>
								<Controller
									name="newKind"
									control={form.control}
									render={({ field }) => (
										<Field>
											<FieldLabel htmlFor={ids.newKind}>Tipo</FieldLabel>
											<Select
												name={field.name}
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger id={ids.newKind} className="w-full">
													<SelectValue placeholder="Tipo">
														{(v: string | null) =>
															v
																? KIND_LABELS[v as (typeof KINDS)[number]]
																: null
														}
													</SelectValue>
												</SelectTrigger>
												<SelectContent alignItemWithTrigger={false}>
													<SelectGroup>
														{KINDS.map((o) => (
															<SelectItem key={o} value={o}>
																{KIND_LABELS[o]}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
										</Field>
									)}
								/>
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
							</>
						)}
					</FieldGroup>
					<div className="flex items-end gap-3">
						<div className="flex gap-2" role="group" aria-label="Cuándo">
							<Button
								type="button"
								variant={mode === "now" ? "default" : "outline"}
								size="sm"
								aria-pressed={mode === "now"}
								onClick={() => {
									setMode("now");
									form.setValue("mode", "now");
								}}
							>
								Ahora
							</Button>
							<Button
								type="button"
								variant={mode === "scheduled" ? "default" : "outline"}
								size="sm"
								aria-pressed={mode === "scheduled"}
								onClick={() => {
									setMode("scheduled");
									form.setValue("mode", "scheduled");
								}}
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
