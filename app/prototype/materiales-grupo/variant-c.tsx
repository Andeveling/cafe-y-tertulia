/**
 * C — Mesa dividida.
 * Izquierda fija: lo que se está tertuliando + memoria.
 * Derecha: lo que se ofrece + tu biblioteca. Dos ritmos, una página.
 */
"use client";

import {
	ArrowRight01Icon,
	Book01Icon,
	Mic01Icon,
	StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CANDIDATES, CURRENT, GROUP_NAME, HISTORY } from "./data";

export function VariantC() {
	const [postulated, setPostulated] = useState<string[]>([]);

	return (
		<main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 md:px-8">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div className="flex flex-col gap-2">
					<h1 className="font-heading text-3xl font-semibold text-balance md:text-4xl">
						La mesa de {GROUP_NAME}
					</h1>
					<p className="max-w-[60ch] text-base text-muted-foreground">
						A la izquierda, lo que se tertulia. A la derecha, lo que se ofrece.
					</p>
				</div>
				<Button type="button" variant="outline">
					Proponer pacto
				</Button>
			</header>

			<div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
				{/* Columna izquierda — fija */}
				<div className="flex flex-col gap-10 lg:sticky lg:top-6 lg:self-start">
					<section
						aria-label="En curso"
						className="overflow-hidden rounded-xl bg-card ring-1 ring-border"
					>
						<div className="relative flex items-end justify-between overflow-hidden bg-muted/40 px-5 pb-4 pt-8">
							<HugeiconsIcon
								icon={Book01Icon}
								aria-hidden
								className="absolute -bottom-5 right-4 size-24 text-primary/20"
							/>
							<span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								{CURRENT.kind}
							</span>
							<Badge className="relative">En curso</Badge>
						</div>
						<div className="flex flex-col gap-2 p-5">
							<h2 className="font-heading text-2xl font-semibold leading-tight text-balance">
								{CURRENT.title}
							</h2>
							<p className="text-sm text-muted-foreground">
								{CURRENT.author} · {CURRENT.sessions} sesiones
							</p>
							<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
								<div className="h-full w-1/2 rounded-full bg-primary" />
							</div>
							<Button type="button" className="mt-3">
								Abrir la tertulia
								<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
							</Button>
						</div>
					</section>

					<section aria-label="Memoria" className="flex flex-col gap-3">
						<h2 className="font-heading text-lg font-semibold">
							Memoria del grupo
						</h2>
						<ul className="flex flex-col divide-y divide-border">
							{HISTORY.map((h) => (
								<li key={h.id} className="flex items-center gap-3 py-3">
									<div
										aria-hidden
										className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted font-heading text-base text-primary"
									>
										{h.initial}
									</div>
									<div className="flex min-w-0 flex-1 flex-col">
										<p className="truncate text-sm font-medium">{h.title}</p>
										<p className="text-xs text-muted-foreground">
											{h.author} · {h.sessions} sesiones
										</p>
									</div>
									{h.rating != null && (
										<span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
											<HugeiconsIcon icon={StarIcon} className="size-3.5" />
											{h.rating.toFixed(1).replace(".", ",")}
										</span>
									)}
								</li>
							))}
						</ul>
					</section>
				</div>

				{/* Columna derecha — oferta */}
				<section aria-label="Postulados" className="flex flex-col gap-6">
					<div className="flex flex-col gap-1">
						<h2 className="font-heading text-2xl font-semibold">Postulados</h2>
						<p className="text-sm text-muted-foreground">
							Cada miembro, como máximo 1 por formato. Sin votos todavía.
						</p>
					</div>

					<ul className="flex flex-col gap-3">
						{CANDIDATES.map((c) => {
							const done = postulated.includes(c.id);
							return (
								<li
									key={c.id}
									className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-border"
								>
									<HugeiconsIcon
										icon={c.kind === "Libro" ? Book01Icon : Mic01Icon}
										className="size-5 shrink-0 text-primary"
										aria-hidden
									/>
									<div className="flex min-w-0 flex-1 flex-col gap-0.5">
										<p className="truncate font-medium">{c.title}</p>
										<p className="text-xs text-muted-foreground">
											{c.author} · {c.kind}
											{c.quotaBlocked ? ` · ${c.quotaBlocked}` : ""}
										</p>
									</div>
									<Button
										type="button"
										size="sm"
										variant={done ? "secondary" : "default"}
										disabled={done || Boolean(c.quotaBlocked)}
										onClick={() => setPostulated((prev) => [...prev, c.id])}
									>
										{done ? "Postulado" : "Postular"}
									</Button>
								</li>
							);
						})}
					</ul>

					<div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center">
						<p className="text-sm text-muted-foreground">
							¿Nada te convoca? Guarda primero en tu biblioteca y vuelve a
							ofrecerlo aquí.
						</p>
						<Button type="button" variant="ghost" size="sm" className="mt-2">
							Ir a mi biblioteca
						</Button>
					</div>
				</section>
			</div>

			<pre className="mx-auto mt-12 max-w-6xl overflow-x-auto text-xs text-muted-foreground">
				{JSON.stringify({ variant: "C", postulated }, null, 2)}
			</pre>
		</main>
	);
}
