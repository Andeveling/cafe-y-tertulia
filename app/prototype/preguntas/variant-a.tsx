/**
 * A — Tablero único
 * Una sola tabla para todos; el Moderador suma un riel lateral con
 * faltantes + online/convocar. El avance abre un panel de pase de lista:
 * por cada faltante, esperar o entra como espectador.
 */
"use client";

import { useState } from "react";
import { InfoButton } from "@/components/info-button";
import { Button } from "@/components/ui/button";
import { COPY, convocable, missing } from "./data";
import type { SharedProps } from "./page";

export function VariantA({
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
	const [gateOpen, setGateOpen] = useState(false);
	const you = members.find((m) => m.id === youId) ?? members[0];
	const miss = missing(members);
	const out = convocable(members);
	const inRoom = members.filter((m) => m.inRoom);

	return (
		<main className="mx-auto grid w-full max-w-4xl gap-8 px-5 py-8 md:grid-cols-[1fr_280px] md:px-8">
			<div className="flex flex-col gap-8">
				<section className="flex flex-col gap-3">
					<div className="flex items-center gap-1.5">
						<h1 className="font-heading text-2xl font-semibold">
							Escribe tu pregunta
						</h1>
						<InfoButton title={COPY.privateTitle} description={COPY.private} />
					</div>
					<textarea
						className="min-h-20 rounded-md border border-border bg-card p-3 text-sm"
						placeholder="¿Qué pregunta querés llevar a la tertulia?"
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
					/>
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground tabular-nums">
							{you.questionCount > 0
								? `${you.questionCount} enviada${you.questionCount > 1 ? "s" : ""} · podés corregirla aquí`
								: "Ninguna enviada aún"}
						</span>
						<Button
							size="sm"
							disabled={!draft.trim()}
							onClick={() => {
								onSaveMine(draft);
								setDraft("");
							}}
						>
							Enviar pregunta
						</Button>
					</div>
				</section>

				<section className="flex flex-col gap-1">
					<h2 className="text-sm font-medium text-muted-foreground">
						Tablero · {inRoom.filter((m) => m.questionCount > 0).length} de{" "}
						{inRoom.length} con pregunta
					</h2>
					<ul>
						{inRoom.map((m) => (
							<li
								key={m.id}
								className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm"
							>
								<span>
									{m.name}
									{m.id === youId && (
										<span className="text-muted-foreground"> · Vos</span>
									)}
									{m.isModerator && (
										<span className="text-muted-foreground"> · Modera</span>
									)}
								</span>
								<span className="text-xs text-muted-foreground">
									{m.role === "spectator"
										? m.questionCount > 0
											? "Espectador · a memoria"
											: "Espectador"
										: m.questionCount > 0
											? m.id === youId
												? `${m.questionCount} enviada${m.questionCount > 1 ? "s" : ""} (solo vos ves el texto)`
												: "Enviada ✓"
											: "Falta pregunta"}
								</span>
							</li>
						))}
					</ul>
					{you.inRoom && you.role === "member" && (
						<button
							type="button"
							className="mt-3 self-start text-xs text-muted-foreground underline underline-offset-4"
							onClick={() => onOptOut(youId, true)}
						>
							Voy solo a mirar (Sin sorteo)
						</button>
					)}
				</section>
			</div>

			{isModeratorView && (
				<aside className="flex h-fit flex-col gap-5 rounded-xl border border-border bg-card p-4">
					<div className="flex flex-col gap-1">
						<h2 className="text-sm font-medium">Pase de lista</h2>
						<p className="text-xs text-muted-foreground">
							{miss.length === 0
								? "Todos tienen pregunta."
								: `Faltan ${miss.length}: ${miss.map((m) => m.name).join(", ")}`}
						</p>
					</div>
					{out.length > 0 && (
						<div className="flex flex-col gap-2">
							<h3 className="text-xs font-medium text-muted-foreground">
								Online fuera de sala
							</h3>
							{out.map((m) => (
								<div
									key={m.id}
									className="flex items-center justify-between gap-2 text-sm"
								>
									<span>{m.name}</span>
									<Button
										size="xs"
										variant="outline"
										onClick={() => onConvocar(m.id)}
									>
										Convocar
									</Button>
								</div>
							))}
						</div>
					)}
					{!gateOpen ? (
						<Button size="sm" onClick={() => setGateOpen(true)}>
							Continuar a Presentes
						</Button>
					) : (
						<div className="flex flex-col gap-3 border-t border-border pt-3">
							{miss.map((m) => (
								<fieldset key={m.id} className="flex flex-col gap-1">
									<legend className="text-sm">{m.name}</legend>
									<label className="flex items-center gap-2 text-xs">
										<input
											type="radio"
											name={`adv-${m.id}`}
											checked={(decisions[m.id] ?? "wait") === "wait"}
											onChange={() => onDecide(m.id, "wait")}
										/>
										Esperar su pregunta
									</label>
									<label className="flex items-center gap-2 text-xs">
										<input
											type="radio"
											name={`adv-${m.id}`}
											checked={decisions[m.id] === "spectator"}
											onChange={() => {
												onDecide(m.id, "spectator");
												onOptOut(m.id, true);
											}}
										/>
										Entra como espectador
									</label>
								</fieldset>
							))}
							{miss.length === 0 && (
								<p className="text-xs text-muted-foreground">
									Nada pendiente: el avance es directo.
								</p>
							)}
							<Button
								size="sm"
								onClick={() => {
									onAdvance();
									setGateOpen(false);
								}}
							>
								{advanced ? "Ya en Presentes ✓" : "Avisar y avanzar"}
							</Button>
						</div>
					)}
				</aside>
			)}
		</main>
	);
}
