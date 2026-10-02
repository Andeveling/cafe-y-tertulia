/**
 * A — Mesa lateral.
 * Formulario siempre visible a la izquierda (sticky), colección
 * editorial a la derecha. El guardado no compite con el repaso:
 * cada zona tiene su columna.
 */
"use client";

import { useState } from "react";
import { MATERIAL_KIND_LABELS } from "@/app/materials/_lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProtoBibliotecaItem } from "./data";
import type { SharedProps } from "./props";

function Cover({ item }: { item: ProtoBibliotecaItem }) {
	return (
		<div
			aria-hidden
			className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-muted font-heading text-xl text-primary"
		>
			{item.title.trim().charAt(0).toUpperCase() || "·"}
		</div>
	);
}

export function VariantA({ items, onAdd, onDelete }: SharedProps) {
	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [motive, setMotive] = useState("");

	return (
		<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 md:px-8">
			<header className="flex flex-col gap-2">
				<h1 className="font-heading text-3xl font-semibold text-balance">
					Mi biblioteca
				</h1>
				<p className="max-w-[65ch] text-base text-muted-foreground">
					Tus candidatos privados. Solo tú los ves; el grupo solo verá lo que
					postules. {items.length} guardados.
				</p>
			</header>

			<div className="grid gap-8 lg:grid-cols-[340px_1fr]">
				<aside className="lg:sticky lg:top-6 lg:self-start">
					<form
						className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
						onSubmit={(e) => {
							e.preventDefault();
							if (!title.trim() || !author.trim()) return;
							onAdd({ title: title.trim(), author: author.trim(), kind: "book", motive });
							setTitle("");
							setAuthor("");
							setMotive("");
						}}
					>
						<h2 className="font-heading text-lg font-semibold">
							Guardar candidato
						</h2>
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
							Por qué lo guardas
							<Textarea
								value={motive}
								onChange={(e) => setMotive(e.target.value)}
								placeholder="Una línea basta…"
								rows={3}
							/>
						</label>
						<Button type="submit">Guardar en mi biblioteca</Button>
						<p className="text-sm text-muted-foreground">
							Después podrás postularlo a tu grupo.
						</p>
					</form>
				</aside>

				<section aria-label="Candidatos" className="flex flex-col gap-4">
					{items.length === 0 ? (
						<div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center">
							<p className="text-sm text-muted-foreground">
								Aún no guardas candidatos. Usa la mesa de la izquierda.
							</p>
						</div>
					) : (
						<ul className="flex flex-col gap-3">
							{items.map((item) => (
								<li
									key={item.id}
									className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
								>
									<Cover item={item} />
									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<p className="font-medium">{item.title}</p>
										<p className="text-xs text-muted-foreground">
											{item.author} · {MATERIAL_KIND_LABELS[item.kind]}
										</p>
										{item.motive && (
											<p className="line-clamp-2 text-sm text-muted-foreground">
												{item.motive}
											</p>
										)}
										<div className="mt-2 flex gap-2">
											<Button size="sm" variant="secondary" type="button">
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
									</div>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</main>
	);
}
