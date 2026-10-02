/**
 * B — Vitrina.
 * Colección primero: barra compacta de guardado arriba, abajo
 * retícula visual de portadas. Pensada para repasar de un vistazo
 * cuando ya hay varios candidatos.
 */
"use client";

import { useState } from "react";
import { MATERIAL_KIND_LABELS } from "@/app/materials/_lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SharedProps } from "./props";

export function VariantB({ items, onAdd, onDelete }: SharedProps) {
	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 md:px-8">
			<header className="flex flex-col gap-2">
				<h1 className="font-heading text-3xl font-semibold text-balance">
					Mi biblioteca
				</h1>
				<p className="max-w-[65ch] text-base text-muted-foreground">
					{items.length} candidatos privados, listos para postular.
				</p>
			</header>

			<form
				className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 md:flex-row"
				onSubmit={(e) => {
					e.preventDefault();
					if (!title.trim() || !author.trim()) return;
					onAdd({ title: title.trim(), author: author.trim(), kind: "book", motive: "" });
					setTitle("");
					setAuthor("");
				}}
			>
				<Input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Título — Ej.: El nombre del viento"
					autoComplete="off"
					className="flex-1"
					aria-label="Título"
				/>
				<Input
					value={author}
					onChange={(e) => setAuthor(e.target.value)}
					placeholder="Autor"
					autoComplete="off"
					className="md:w-48"
					aria-label="Autor"
				/>
				<Button type="submit" className="md:w-auto">
					Guardar
				</Button>
			</form>

			{items.length === 0 ? (
				<div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center">
					<p className="text-sm text-muted-foreground">
						Vitrina vacía. Guarda tu primer candidato arriba.
					</p>
				</div>
			) : (
				<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{items.map((item) => (
						<li
							key={item.id}
							className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
						>
							<div className="flex h-24 items-center justify-center bg-muted/40 font-heading text-4xl text-primary">
								{item.title.trim().charAt(0).toUpperCase() || "·"}
							</div>
							<div className="flex flex-1 flex-col gap-1 p-4">
								<Badge variant="secondary" className="w-fit text-xs">
									{MATERIAL_KIND_LABELS[item.kind]}
								</Badge>
								<p className="font-heading text-base font-semibold">{item.title}</p>
								<p className="text-sm text-muted-foreground">{item.author}</p>
								{item.motive && (
									<p className="line-clamp-3 text-sm text-muted-foreground">
										{item.motive}
									</p>
								)}
								<div className="mt-auto flex items-center justify-between pt-3">
									<Button size="sm" variant="link" type="button" className="px-0">
										Postular →
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
							</div>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}
