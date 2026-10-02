/**
 * A — Sobremesa editorial.
 * Una sola voz: el material en curso se lee como titular de revista,
 * lo demás respira debajo con divisores, sin cajas anidadas.
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

export function VariantA() {
	const [postulated, setPostulated] = useState<string[]>([]);

	return (
		<main className="mx-auto w-full max-w-3xl px-5 pb-24 pt-10 md:px-8">
			<header className="flex flex-col gap-3">
				<h1 className="font-heading text-3xl font-semibold text-balance md:text-4xl">
					La estantería de {GROUP_NAME}
				</h1>
				<p className="max-w-[65ch] text-base text-muted-foreground">
					Solo crece por sorteo o pacto. Esto es lo que está sobre la mesa y lo
					que viene después.
				</p>
			</header>

			{/* Ahora sobre la mesa */}
			<section aria-label="Ahora sobre la mesa" className="mt-12">
				<div className="flex items-center gap-5">
					<div
						aria-hidden
						className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-4xl text-primary-foreground"
					>
						{CURRENT.initial}
					</div>
					<div className="flex min-w-0 flex-col gap-1.5">
						<div className="flex flex-wrap items-center gap-2">
							<Badge>En curso</Badge>
							<span className="text-sm text-muted-foreground">
								{CURRENT.kind}
							</span>
						</div>
						<h2 className="font-heading text-2xl font-semibold leading-tight text-balance">
							{CURRENT.title}
						</h2>
						<p className="text-sm text-muted-foreground">
							{CURRENT.author} · {CURRENT.sessions} sesiones · sin votos todavía
						</p>
					</div>
				</div>
				<div className="mt-5 flex flex-wrap items-center gap-3">
					<Button type="button">
						Abrir la tertulia
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
					</Button>
					<Button type="button" variant="ghost">
						Ver historial
					</Button>
				</div>
			</section>

			<hr className="my-12 border-border" />

			{/* Lo que sigue */}
			<section aria-label="Lo que sigue" className="flex flex-col gap-6">
				<div className="flex flex-col gap-1">
					<h2 className="font-heading text-2xl font-semibold">Lo que sigue</h2>
					<p className="text-sm text-muted-foreground">
						Lo que los miembros ofrecen. Cada uno postula como máximo 1 por
						formato.
					</p>
				</div>

				<ul className="flex flex-col divide-y divide-border">
					{CANDIDATES.map((c) => {
						const done = postulated.includes(c.id);
						return (
							<li
								key={c.id}
								className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
							>
								<HugeiconsIcon
									icon={c.kind === "Libro" ? Book01Icon : Mic01Icon}
									className="size-5 shrink-0 text-muted-foreground"
									aria-hidden
								/>
								<div className="flex min-w-0 flex-1 flex-col">
									<p className="truncate font-medium">{c.title}</p>
									<p className="text-sm text-muted-foreground">
										{c.author} · {c.kind}
										{c.quotaBlocked ? ` · ${c.quotaBlocked}` : ""}
									</p>
								</div>
								<Button
									type="button"
									variant={done ? "secondary" : "outline"}
									size="sm"
									disabled={done || Boolean(c.quotaBlocked)}
									onClick={() => setPostulated((prev) => [...prev, c.id])}
								>
									{done ? "Postulado" : "Postular"}
								</Button>
							</li>
						);
					})}
				</ul>

				<div className="flex flex-col gap-2 rounded-xl border border-dashed border-border/70 px-4 py-5">
					<p className="text-sm text-muted-foreground">
						Todavía no hay postulados votados en este grupo. Lo de arriba son
						candidatos desde tu biblioteca.
					</p>
				</div>
			</section>

			<hr className="my-12 border-border" />

			{/* Memoria */}
			<section aria-label="Memoria" className="flex flex-col gap-4">
				<h2 className="font-heading text-2xl font-semibold">Memoria</h2>
				<ul className="flex flex-col gap-3">
					{HISTORY.map((h) => (
						<li key={h.id} className="flex items-baseline gap-3 text-sm">
							<span className="shrink-0 text-muted-foreground">
								{h.sessions} ses.
							</span>
							<p className="min-w-0 flex-1 truncate">
								<span className="font-medium">{h.title}</span>{" "}
								<span className="text-muted-foreground">— {h.author}</span>
							</p>
							{h.rating != null && (
								<span className="flex shrink-0 items-center gap-1 text-muted-foreground">
									<HugeiconsIcon icon={StarIcon} className="size-3.5" />
									{h.rating.toFixed(1).replace(".", ",")}
								</span>
							)}
						</li>
					))}
				</ul>
			</section>

			<pre className="mt-12 overflow-x-auto text-xs text-muted-foreground">
				{JSON.stringify(
					{ variant: "A", postulated, group: GROUP_NAME },
					null,
					2,
				)}
			</pre>
		</main>
	);
}
