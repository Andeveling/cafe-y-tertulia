"use client";

// PROTOTYPE — throwaway, no tests. Question: ¿cómo debe verse el header "Plan de Tertulias" con Rango/Fecha/Nueva sesión?
// Tres variantes estructurales sobre /prototype/plan-tertulias?variant=
// Basado en DESIGN.md — Sophisticated Lounge, no docs/design-system.md

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const VARIANTS = ["A", "B", "C"] as const;

function VariantA() {
	const [range, setRange] = useState("");
	const [date, setDate] = useState<Date | undefined>();
	return (
		<div className="mx-auto max-w-6xl px-6 py-8">
			<div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
				<div>
					<h2 className="font-heading text-4xl font-semibold leading-none tracking-tight">
						Plan de Tertulias
					</h2>
					<p className="mt-2 text-lg leading-7 text-muted-foreground">
						Organiza y sigue las sesiones para completar este material.
					</p>
				</div>
				<div className="flex w-full max-w-[520px] flex-col gap-3">
					<div className="flex gap-3">
						<Field className="flex-1">
							<FieldLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
								Rango cubierto
							</FieldLabel>
							<Input
								placeholder='Ej. "Capítulos 1-3"'
								value={range}
								onChange={(e) => setRange(e.target.value)}
								className="bg-card"
							/>
						</Field>
						<Field className="flex-1">
							<FieldLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
								Fecha programada
							</FieldLabel>
							<DatePicker
								date={date}
								onSelect={setDate}
								placeholder="Sin fecha"
							/>
						</Field>
					</div>
					<Button className="w-fit">
						<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
						Nueva sesión
					</Button>
					<p className="text-xs text-muted-foreground">
						Fiel a DESIGN.md — inputs #140B07 con borde ámbar al foco, 16px
						padding, tonal layering.
					</p>
				</div>
			</div>
			<Card className="p-4 text-sm text-muted-foreground">
				Lista de sesiones (mock) — no interacciona, solo contexto.
			</Card>
		</div>
	);
}

function VariantB() {
	const [range, setRange] = useState("");
	const [date, setDate] = useState<Date | undefined>();
	const [open, setOpen] = useState(false);
	return (
		<div className="mx-auto max-w-3xl px-6 py-12 text-center">
			<h2 className="font-heading text-4xl font-semibold tracking-tight">
				Plan de Tertulias
			</h2>
			<p className="mx-auto mt-3 max-w-xl text-lg leading-7 text-muted-foreground">
				Organiza y sigue las sesiones para completar este material. Una sola
				acción a la vez.
			</p>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger
					render={
						<Button size="lg" className="mt-6">
							<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
							Planificar nueva sesión
						</Button>
					}
				/>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-heading text-2xl">
							Nueva sesión
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-4">
						<Field>
							<FieldLabel>Rango cubierto</FieldLabel>
							<Input
								placeholder='Ej. "Capítulos 1-3"'
								value={range}
								onChange={(e) => setRange(e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel>Fecha programada</FieldLabel>
							<DatePicker
								date={date}
								onSelect={setDate}
								placeholder="Sin fecha"
							/>
						</Field>
						<Button onClick={() => setOpen(false)}>Crear sesión</Button>
					</div>
				</DialogContent>
			</Dialog>
			<p className="mt-3 text-xs uppercase tracking-[0.05em] text-muted-foreground">
				Rango · Fecha dentro del diálogo — header respira, sin inputs siempre
				visibles
			</p>
			<Card className="mt-8 p-4 text-left text-sm text-muted-foreground">
				Sesiones (mock) — 2 en curso, 1 lobby
			</Card>
		</div>
	);
}

function VariantC() {
	const [range, setRange] = useState("");
	const [date, setDate] = useState<Date | undefined>();
	return (
		<div className="mx-auto max-w-6xl px-6 py-8">
			<div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h2 className="font-heading text-2xl font-semibold">
							Plan de Tertulias
						</h2>
						<p className="text-sm text-muted-foreground">
							2 de 5 sesiones · 40% completado
						</p>
					</div>
					<div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
						<div className="h-full w-[40%] bg-primary" />
					</div>
				</div>
				<div className="h-px bg-border" />
				<div className="flex flex-wrap items-end gap-2">
					<div className="flex min-w-[180px] flex-1 items-end gap-2">
						<Field className="flex-1">
							<FieldLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
								Rango
							</FieldLabel>
							<Input
								placeholder="Capítulos 1-3"
								value={range}
								onChange={(e) => setRange(e.target.value)}
								className="h-9"
							/>
						</Field>
						<Field className="flex-1">
							<FieldLabel className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
								Fecha
							</FieldLabel>
							<DatePicker
								date={date}
								onSelect={setDate}
								placeholder="Sin fecha"
							/>
						</Field>
					</div>
					<Button className="h-9">
						<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
						Añadir
					</Button>
				</div>
				<p className="text-xs text-muted-foreground">
					Toolbar compacta + progreso — no es formulario, es barra de
					herramientas. DESIGN.md: 16px padding, gap 16.
				</p>
			</div>
			<div className="mt-6 grid gap-3 sm:grid-cols-2">
				<Card className="p-4 text-sm">Capítulo prólogo — Ver memoria</Card>
				<Card className="p-4 text-sm">Capítulos 1-3 — Lobby · Sin fecha</Card>
			</div>
		</div>
	);
}

function PrototypeContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const current =
		(searchParams.get("variant") as (typeof VARIANTS)[number]) ?? "A";
	const idx = VARIANTS.indexOf(current);
	const prev = () =>
		router.replace(
			`?variant=${VARIANTS[(idx - 1 + VARIANTS.length) % VARIANTS.length]}`,
		);
	const next = () =>
		router.replace(`?variant=${VARIANTS[(idx + 1) % VARIANTS.length]}`);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (
				t?.tagName === "INPUT" ||
				t?.tagName === "TEXTAREA" ||
				t?.isContentEditable
			)
				return;
			if (e.key === "ArrowLeft") prev();
			if (e.key === "ArrowRight") next();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	return (
		<div className="min-h-screen bg-background pb-20">
			<header className="border-b border-border px-6 py-4">
				<p className="text-sm text-muted-foreground">
					Prototipo — Plan de Tertulias ·{" "}
					<span className="font-medium text-foreground">
						Variante {current}
					</span>
				</p>
			</header>
			{current === "A" && <VariantA />}
			{current === "B" && <VariantB />}
			{current === "C" && <VariantC />}
			{process.env.NODE_ENV !== "production" && (
				<nav className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5 shadow-lg">
					<button
						type="button"
						onClick={prev}
						className="text-muted-foreground transition-colors hover:text-foreground"
						aria-label="Anterior"
					>
						←
					</button>
					<span className="min-w-[200px] text-center text-sm font-medium">
						{current === "A" && "A — Inline Lounge"}
						{current === "B" && "B — Dialog centrado"}
						{current === "C" && "C — Toolbar + progreso"}
					</span>
					<button
						type="button"
						onClick={next}
						className="text-muted-foreground transition-colors hover:text-foreground"
						aria-label="Siguiente"
					>
						→
					</button>
				</nav>
			)}
		</div>
	);
}

export default function PlanTertuliasPrototype() {
	return (
		<Suspense>
			<PrototypeContent />
		</Suspense>
	);
}
