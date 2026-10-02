/**
 * C — Bandeja + diálogo.
 * La colección ocupa todo el ancho como bandeja con filtros por
 * formato. El formulario vive en un diálogo: guardar es un gesto,
 * no una zona permanente.
 */
"use client";

import { useState } from "react";
import type { MaterialKind } from "@/app/materials/_lib/constants";
import { MATERIAL_KIND_LABELS } from "@/app/materials/_lib/constants";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SharedProps } from "./props";

const FILTERS: Array<"all" | MaterialKind> = [
	"all",
	"book",
	"podcast",
	"video",
	"article",
];

export function VariantC({ items, onAdd, onDelete }: SharedProps) {
	const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [motive, setMotive] = useState("");

	const visible =
		filter === "all" ? items : items.filter((i) => i.kind === filter);

	function save() {
		if (!title.trim() || !author.trim()) return;
		onAdd({ title: title.trim(), author: author.trim(), kind: "book", motive });
		setTitle("");
		setAuthor("");
		setMotive("");
		setOpen(false);
	}

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8 md:px-8">
			<header className="flex items-end justify-between gap-4">
				<div className="flex flex-col gap-2">
					<h1 className="font-heading text-3xl font-semibold text-balance">
						Mi biblioteca
					</h1>
					<p className="text-base text-muted-foreground tabular-nums">
						{items.length} candidatos · solo tú los ves
					</p>
				</div>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger
						render={
							<Button type="button">Guardar candidato</Button>
						}
					/>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Guardar candidato</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-4">
							<label className="flex flex-col gap-1.5 text-sm">
								Título
								<Input
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Ej.: El nombre del viento"
									autoComplete="off"
								/>
							</label>
							<label className="flex flex-col gap-1.5 text-sm">
								Autor
								<Input
									value={author}
									onChange={(e) => setAuthor(e.target.value)}
									placeholder="Ej.: Patrick Rothfuss"
									autoComplete="off"
								/>
							</label>
							<label className="flex flex-col gap-1.5 text-sm">
								Motivo (opcional)
								<Textarea
									value={motive}
									onChange={(e) => setMotive(e.target.value)}
									placeholder="Por qué lo guardas…"
									rows={3}
								/>
							</label>
						</div>
						<DialogFooter>
							<Button type="button" variant="ghost" onClick={() => setOpen(false)}>
								Cancelar
							</Button>
							<Button type="button" onClick={save}>
								Guardar
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</header>

			<nav aria-label="Filtrar por formato" className="flex flex-wrap gap-2">
				{FILTERS.map((f) => {
					const active = filter === f;
					const count =
						f === "all"
							? items.length
							: items.filter((i) => i.kind === f).length;
					return (
						<Button
							key={f}
							type="button"
							size="sm"
							variant={active ? "secondary" : "ghost"}
							onClick={() => setFilter(f)}
						>
							{f === "all" ? "Todos" : MATERIAL_KIND_LABELS[f]} · {count}
						</Button>
					);
				})}
			</nav>

			{visible.length === 0 ? (
				<div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center">
					<p className="text-sm text-muted-foreground">
						Nada aquí con este filtro. Cambia de formato o guarda un candidato.
					</p>
				</div>
			) : (
				<ul className="overflow-hidden rounded-xl border border-border bg-card">
					{visible.map((item, idx) => (
						<li
							key={item.id}
							className={
								"flex items-center justify-between gap-4 px-4 py-3 " +
								(idx > 0 ? "border-t border-border" : "")
							}
						>
							<div className="min-w-0">
								<p className="truncate font-medium">{item.title}</p>
								<p className="truncate text-xs text-muted-foreground">
									{item.author} · {MATERIAL_KIND_LABELS[item.kind]}
									{item.motive ? ` · ${item.motive}` : ""}
								</p>
							</div>
							<div className="flex shrink-0 gap-2">
								<Button size="sm" variant="outline" type="button">
									Postular
								</Button>
								<Button
									size="sm"
									variant="ghost"
									type="button"
									onClick={() => onDelete(item.id)}
								>
									Quitar
								</Button>
							</div>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}
