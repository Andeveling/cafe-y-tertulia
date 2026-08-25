"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { MaterialKind } from "@/app/materials/_lib/constants";
import { createSession } from "@/app/materials/_lib/materials-actions";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Separator } from "@/components/ui/separator";

// ── Types ────────────────────────────────────────────────────────────────────

export type BoardSession = {
	id: string;
	status: "lobby" | "in_progress" | "preparation";
	scheduled_at: string | null;
	range: string | null;
	moderator_name: string | null;
	material_title: string | null;
};

type MaterialOption = { id: string; title: string };

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

// ── Schema ───────────────────────────────────────────────────────────────────

const createSchema = z
	.object({
		label: z.string().optional(),
		materialMode: z.enum(["none", "existing", "new"]),
		existingMaterialId: z.string().optional(),
		newTitle: z.string().optional(),
		newAuthor: z.string().optional(),
		newKind: z.enum(MATERIAL_KIND_OPTIONS).optional(),
		range: z.string().optional(),
		mode: z.enum(["now", "scheduled"]),
		scheduledAt: z.date().optional(),
	})
	.refine(
		(data) => data.mode !== "scheduled" || data.scheduledAt !== undefined,
		{ message: "La fecha es obligatoria.", path: ["scheduledAt"] },
	)
	.refine(
		(data) =>
			data.materialMode !== "new" ||
			(data.newTitle?.trim() && data.newAuthor?.trim()),
		{
			message: "Título y autor son obligatorios.",
			path: ["newTitle"],
		},
	);

type CreateValues = z.infer<typeof createSchema>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function sessionTitle(s: BoardSession): string {
	if (s.range) return s.range;
	if (s.material_title) return s.material_title;
	return `Sesión de ${s.moderator_name ?? "alguien"}`;
}

function scheduledLabel(iso: string | null): string {
	if (!iso) return "Sin fecha";
	return format(new Date(iso), "EEE d MMM, HH:mm", { locale: es });
}

// ── Component ────────────────────────────────────────────────────────────────

export function InicioBoard({
	sessions,
	materials,
	displayName,
}: {
	sessions: BoardSession[];
	materials: MaterialOption[];
	displayName: string;
}) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [mode, setMode] = useState<"now" | "scheduled">("now");

	const openSessions = sessions.filter(
		(s) => s.status === "lobby" || s.status === "in_progress",
	);
	const scheduledSessions = sessions.filter((s) => s.status === "preparation");

	const form = useForm<CreateValues>({
		resolver: zodResolver(createSchema),
		defaultValues: {
			label: "",
			materialMode: "none",
			existingMaterialId: "",
			newTitle: "",
			newAuthor: "",
			newKind: "book",
			range: "",
			mode: "now",
		},
	});

	const materialMode = form.watch("materialMode");

	function onSubmit(data: CreateValues) {
		startTransition(async () => {
			const payload: Parameters<typeof createSession>[0] = {
				range: data.label?.trim() || undefined,
				scheduledAt:
					data.mode === "scheduled" && data.scheduledAt
						? data.scheduledAt.toISOString()
						: undefined,
			};

			if (data.materialMode === "existing" && data.existingMaterialId) {
				payload.materialId = data.existingMaterialId;
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

			if (data.mode === "now") {
				router.push("/room");
			} else {
				toast.success("Sesión creada");
				form.reset();
			}
		});
	}

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
			{/* Header */}
			<header className="flex items-center justify-between gap-4">
				<h1 className="font-heading text-2xl font-medium">Sesiones</h1>
				<Button
					variant="outline"
					nativeButton={false}
					render={<Link href="/invite" />}
				>
					Invitar a alguien
				</Button>
			</header>

			{/* Presencia */}
			<div
				aria-label="Presencia"
				className="flex items-center gap-2 text-sm text-muted-foreground"
			>
				<AvatarGroup>
					<Avatar size="sm">
						<AvatarFallback />
					</Avatar>
				</AvatarGroup>
				<span>En la app</span>
			</div>

			{/* Salas abiertas */}
			{openSessions.length > 0 && (
				<Card>
					<CardContent className="p-0">
						<ul className="divide-y divide-border">
							{openSessions.map((s) => (
								<li
									key={s.id}
									className="flex items-center justify-between gap-3 px-4 py-3"
								>
									<div className="flex min-w-0 items-center gap-2">
										<span className="truncate text-sm font-medium">
											{sessionTitle(s)}
										</span>
										{s.material_title && (
											<span className="shrink-0 text-xs text-muted-foreground">
												{s.material_title}
											</span>
										)}
									</div>
									<div className="flex shrink-0 items-center gap-2">
										<Badge variant="secondary">Sala</Badge>
										<Button
											size="sm"
											nativeButton={false}
											render={
												<Link href={`/materials/sessions/${s.id}/room`} />
											}
										>
											Entrar
										</Button>
									</div>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}

			{/* Crear */}
			<Card>
				<CardContent>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-4"
					>
						<FieldGroup>
							{/* Etiqueta */}
							<Controller
								name="label"
								control={form.control}
								render={({ field }) => (
									<Field>
										<FieldLabel htmlFor="label">Etiqueta</FieldLabel>
										<Input
											{...field}
											id="label"
											placeholder={`Sesión de ${displayName}`}
										/>
									</Field>
								)}
							/>

							{/* Material */}
							<Controller
								name="materialMode"
								control={form.control}
								render={({ field }) => (
									<Field>
										<FieldLabel htmlFor="materialMode">Material</FieldLabel>
										<NativeSelect
											{...field}
											id="materialMode"
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

							{/* Existing material → hidden id + range */}
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
												<FieldLabel htmlFor="range">Rango</FieldLabel>
												<Input {...field} id="range" placeholder="Cap. 1–5" />
											</Field>
										)}
									/>
								</>
							)}

							{/* New material fields */}
							{materialMode === "new" && (
								<>
									<Controller
										name="newTitle"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor="newTitle">Título</FieldLabel>
												<Input
													{...field}
													id="newTitle"
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
												<FieldLabel htmlFor="newAuthor">Autor</FieldLabel>
												<Input
													{...field}
													id="newAuthor"
													placeholder="Miguel de Cervantes"
												/>
											</Field>
										)}
									/>
									<Controller
										name="newKind"
										control={form.control}
										render={({ field }) => (
											<Field>
												<FieldLabel htmlFor="newKind">Tipo</FieldLabel>
												<Select
													name={field.name}
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger id="newKind" className="w-full">
														<SelectValue placeholder="Tipo">
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
															{MATERIAL_KIND_OPTIONS.map((opt) => (
																<SelectItem key={opt} value={opt}>
																	{MATERIAL_KIND_LABELS[opt]}
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
												<FieldLabel htmlFor="range">Rango</FieldLabel>
												<Input {...field} id="range" placeholder="Cap. 1–5" />
											</Field>
										)}
									/>
								</>
							)}
						</FieldGroup>

						{/* When toggle + date */}
						<div className="flex items-end gap-3">
							<div className="flex gap-2">
								<Button
									type="button"
									variant={mode === "now" ? "default" : "outline"}
									size="sm"
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
											<DatePicker
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
				</CardContent>
			</Card>

			{/* Lista de programadas */}
			{scheduledSessions.length > 0 && (
				<Card>
					<CardContent className="p-0">
						<ul className="divide-y divide-border">
							{scheduledSessions.map((s) => (
								<li key={s.id}>
									<Link
										href={`/materials/sessions/${s.id}`}
										className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
									>
										<span className="truncate text-sm font-medium">
											{sessionTitle(s)}
										</span>
										<span className="shrink-0 text-xs text-muted-foreground">
											{scheduledLabel(s.scheduled_at)}
										</span>
									</Link>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}

			{/* Empty state */}
			{openSessions.length === 0 && scheduledSessions.length === 0 && (
				<p className="text-sm text-muted-foreground">Aún no hay sesiones.</p>
			)}
		</div>
	);
}
