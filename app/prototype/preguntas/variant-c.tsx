/**
 * C — Mi pregunta primero
 * Héroe = tu editor (lo único grande). El resto colapsa a una línea
 * ("3 enviadas ✓"). El Moderador suma una hoja de revisión fija abajo
 * con la decisión por faltante y el avance.
 */
"use client";

import { useState } from "react";
import { InfoButton } from "@/components/info-button";
import { Button } from "@/components/ui/button";
import { COPY, convocable, missing } from "./data";
import type { SharedProps } from "./page";

export function VariantC({
	members,
	youId,
	isModeratorView,
	onSaveMine,
	onOptOut,
	onConvocar,
	decisions,
	onDecide,
	onAdvance,
	advanced,
}: SharedProps) {
	const [draft, setDraft] = useState("");
	const [open, setOpen] = useState(false);
	const you = members.find((m) => m.id === youId) ?? members[0];
	const miss = missing(members);
	const out = convocable(members);
	const sent = members.filter((m) => m.inRoom && m.questionCount > 0).length;

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 pb-48 md:px-8">
			<header className="flex items-baseline justify-between gap-3">
				<h1 className="font-heading text-2xl font-semibold">Tu pregunta</h1>
				<button
					type="button"
					className="text-sm text-muted-foreground underline underline-offset-4"
					onClick={() => setOpen((v) => !v)}
				>
					{sent} enviadas ✓ {open ? "· ocultar" : "· ver"}
				</button>
			</header>

			<textarea
				className="min-h-40 rounded-xl border border-border bg-card p-4 text-base"
				placeholder="¿Qué pregunta querés llevar a la tertulia?"
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
			/>
			<div className="flex items-center justify-between">
				<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
					{you.questionCount} enviada{you.questionCount === 1 ? "" : "s"} ·
					privada
					<InfoButton title={COPY.privateTitle} description={COPY.private} />
				</span>
				<Button
					disabled={!draft.trim()}
					onClick={() => {
						onSaveMine(draft);
						setDraft("");
					}}
				>
					Enviar pregunta
				</Button>
			</div>

			{open && (
				<ul className="flex flex-col gap-1 rounded-xl border border-border p-4">
					{members
						.filter((m) => m.inRoom)
						.map((m) => (
							<li
								key={m.id}
								className="flex justify-between gap-3 py-1.5 text-sm"
							>
								<span>
									{m.name}
									{m.id === youId && (
										<span className="text-muted-foreground"> · Vos</span>
									)}
								</span>
								<span className="text-xs text-muted-foreground">
									{m.role === "spectator"
										? "Espectador"
										: m.questionCount > 0
											? m.id === youId
												? "Tuya (privada)"
												: "Enviada ✓"
											: "Falta"}
								</span>
							</li>
						))}
				</ul>
			)}

			{you.role === "member" && (
				<button
					type="button"
					className="self-start text-xs text-muted-foreground underline underline-offset-4"
					onClick={() => onOptOut(youId, true)}
				>
					Prefiero solo mirar esta vez
				</button>
			)}

			{isModeratorView && (
				<section
					aria-label="Revisión del moderador"
					className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-2xl px-5 md:px-8"
				>
					<div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xl">
						<div className="flex items-baseline justify-between gap-2">
							<p className="text-sm font-medium">
								{miss.length === 0
									? "Todos listos para Presentes"
									: `Faltan ${miss.length}: ¿esperamos o entran mirando?`}
							</p>
							<Button size="sm" onClick={onAdvance}>
								{advanced ? "Ya en Presentes ✓" : "Avanzar"}
							</Button>
						</div>
						{miss.map((m) => (
							<div
								key={m.id}
								className="flex items-center justify-between gap-2 text-sm"
							>
								<span>{m.name}</span>
								<select
									className="rounded-md border border-border bg-background px-2 py-1 text-xs"
									value={decisions[m.id] ?? "wait"}
									onChange={(e) => {
										const d = e.target.value as "wait" | "spectator";
										onDecide(m.id, d);
										if (d === "spectator") onOptOut(m.id, true);
									}}
								>
									<option value="wait">Esperar pregunta</option>
									<option value="spectator">Entra como espectador</option>
								</select>
							</div>
						))}
						{out.length > 0 && (
							<div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
								<span className="text-xs text-muted-foreground">Convocar:</span>
								{out.map((m) => (
									<button
										key={m.id}
										type="button"
										className="text-xs underline underline-offset-4"
										onClick={() => onConvocar(m.id)}
									>
										{m.name}
									</button>
								))}
							</div>
						)}
					</div>
				</section>
			)}
		</main>
	);
}
