/**
 * B — El ritual en tres tiempos.
 * La página es la secuencia: mesa → lo que sigue → tu turno.
 * Una sola columna, divisores generosos, cada tiempo con su affordance.
 */
"use client";

import {
	ArrowRight01Icon,
	Book01Icon,
	Mic01Icon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CANDIDATES, CURRENT, GROUP_NAME } from "./data";

const TIMES = ["Ahora en la mesa", "Lo que sigue", "Tu turno"] as const;

export function VariantB() {
	const [postulated, setPostulated] = useState<string[]>([]);
	const [time, setTime] = useState<(typeof TIMES)[number]>("Ahora en la mesa");

	return (
		<main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-10 md:px-8">
			<header className="flex flex-col gap-4">
				<h1 className="font-heading text-3xl font-semibold text-balance md:text-4xl">
					Materiales de {GROUP_NAME}
				</h1>
				<nav aria-label="Tiempos del ritual">
					<ul className="flex gap-2">
						{TIMES.map((t) => (
							<li key={t}>
								<button
									type="button"
									onClick={() => setTime(t)}
									aria-pressed={time === t}
									className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
										time === t
											? "bg-primary font-medium text-primary-foreground"
											: "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
									}`}
								>
									{t}
								</button>
							</li>
						))}
					</ul>
				</nav>
			</header>

			{time === "Ahora en la mesa" && (
				<section aria-label="Ahora en la mesa" className="mt-12 text-center">
					<Badge className="mx-auto">En curso · Sesión 3 de 4</Badge>
					<p className="mt-5 text-sm uppercase tracking-[0.08em] text-muted-foreground">
						{CURRENT.author} · {CURRENT.kind}
					</p>
					<h2 className="mx-auto mt-2 max-w-[20ch] font-heading text-4xl font-semibold leading-tight text-balance md:text-5xl">
						{CURRENT.title}
					</h2>
					<div
						aria-hidden
						className="mx-auto mt-8 h-1.5 w-40 overflow-hidden rounded-full bg-muted"
					>
						<div className="h-full w-2/3 rounded-full bg-primary" />
					</div>
					<p className="mt-3 text-sm text-muted-foreground">
						2 sesiones tertuliadas · quedan unas 2
					</p>
					<div className="mt-8 flex items-center justify-center gap-3">
						<Button type="button">
							Entrar a la sesión
							<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							onClick={() => setTime("Lo que sigue")}
						>
							Ver lo que sigue
						</Button>
					</div>
				</section>
			)}

			{time === "Lo que sigue" && (
				<section aria-label="Lo que sigue" className="mt-12">
					<h2 className="font-heading text-2xl font-semibold">Lo que sigue</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Candidatos ofrecidos por los miembros. El grupo pacta o sortea.
					</p>
					<ul className="mt-6 flex flex-col gap-4">
						{CANDIDATES.map((c, i) => (
							<li
								key={c.id}
								className="flex items-start gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0"
							>
								<span
									aria-hidden
									className="font-heading text-lg text-muted-foreground tabular-nums"
								>
									{String(i + 1).padStart(2, "0")}
								</span>
								<HugeiconsIcon
									icon={c.kind === "Libro" ? Book01Icon : Mic01Icon}
									className="mt-1 size-5 shrink-0 text-primary"
									aria-hidden
								/>
								<div className="flex min-w-0 flex-1 flex-col gap-0.5">
									<p className="font-heading text-lg font-semibold leading-snug">
										{c.title}
									</p>
									<p className="text-sm text-muted-foreground">
										{c.author} · {c.kind}
									</p>
								</div>
							</li>
						))}
					</ul>
					<div className="mt-8 flex justify-center">
						<Button
							type="button"
							variant="secondary"
							onClick={() => setTime("Tu turno")}
						>
							Ofrecer el mío
						</Button>
					</div>
				</section>
			)}

			{time === "Tu turno" && (
				<section aria-label="Tu turno" className="mt-12">
					<h2 className="font-heading text-2xl font-semibold">Tu turno</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Desde tu biblioteca. Máximo 1 por formato.
					</p>
					<div className="mt-6 rounded-xl border border-dashed border-border/70 p-5">
						<ul className="flex flex-col gap-5">
							{CANDIDATES.map((c) => {
								const done = postulated.includes(c.id);
								return (
									<li key={c.id} className="flex flex-col gap-2">
										<div className="flex items-center justify-between gap-3">
											<p className="min-w-0 flex-1 truncate font-medium">
												{c.title}
											</p>
											{done && (
												<span className="flex items-center gap-1 text-sm text-primary">
													<HugeiconsIcon icon={Tick01Icon} className="size-4" />
													Ofrecido
												</span>
											)}
										</div>
										<p className="text-sm text-muted-foreground">
											{c.author} · {c.kind}
											{c.quotaBlocked ? ` · ${c.quotaBlocked}` : ""}
										</p>
										<Button
											type="button"
											variant={done ? "secondary" : "default"}
											size="sm"
											className="self-start"
											disabled={done || Boolean(c.quotaBlocked)}
											onClick={() => setPostulated((prev) => [...prev, c.id])}
										>
											{done ? "Ya lo ofreciste" : "Postular este"}
										</Button>
									</li>
								);
							})}
						</ul>
					</div>
				</section>
			)}

			<pre className="mt-12 overflow-x-auto text-xs text-muted-foreground">
				{JSON.stringify({ variant: "B", time, postulated }, null, 2)}
			</pre>
		</main>
	);
}
