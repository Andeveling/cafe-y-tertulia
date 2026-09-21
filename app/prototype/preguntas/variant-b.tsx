/**
 * B — Comando
 * El Moderador manda desde una franja superior (conteos, faltantes,
 * convocar, avance). El tablero agrupa por estado y el editor propio
 * vive abajo: jerarquía invertida respecto de A.
 */
"use client";

import { useState } from "react";
import { InfoButton } from "@/components/info-button";
import { Button } from "@/components/ui/button";
import { COPY, convocable, missing } from "./data";
import type { SharedProps } from "./page";

export function VariantB({
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
	const ready = members.filter(
		(m) => m.inRoom && m.role === "member" && m.questionCount > 0,
	);
	const spectators = members.filter((m) => m.inRoom && m.role === "spectator");

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-8 md:px-8">
			{isModeratorView && (
				<section
					aria-label="Comando del moderador"
					className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-primary/20"
				>
					<div className="flex flex-wrap items-baseline justify-between gap-2">
						<p className="font-heading text-lg font-semibold">
							Preguntas · {ready.length} con pregunta
							{miss.length > 0 && (
								<span className="text-muted-foreground">
									{" "}
									· faltan {miss.map((m) => m.name).join(", ")}
								</span>
							)}
						</p>
						{!gateOpen ? (
							<Button size="sm" onClick={() => setGateOpen(true)}>
								Continuar a Presentes
							</Button>
						) : (
							<Button
								size="sm"
								variant="outline"
								onClick={() => setGateOpen(false)}
							>
								Cerrar pase de lista
							</Button>
						)}
					</div>
					{out.length > 0 && (
						<div className="flex flex-wrap items-center gap-2 text-sm">
							<span className="text-xs text-muted-foreground">Convocar:</span>
							{out.map((m) => (
								<Button
									key={m.id}
									size="xs"
									variant="outline"
									onClick={() => onConvocar(m.id)}
								>
									{m.name}
								</Button>
							))}
						</div>
					)}
					{gateOpen && (
						<div className="flex flex-col gap-3 border-t border-border pt-3">
							{miss.length === 0 && (
								<p className="text-xs text-muted-foreground">
									Todos tienen pregunta: el avance es directo.
								</p>
							)}
							{miss.map((m) => (
								<div
									key={m.id}
									className="flex items-center justify-between gap-3"
								>
									<span className="text-sm">{m.name}</span>
									<div className="flex gap-2">
										<Button
											size="xs"
											variant={
												(decisions[m.id] ?? "wait") === "wait"
													? "default"
													: "outline"
											}
											onClick={() => onDecide(m.id, "wait")}
										>
											Esperar
										</Button>
										<Button
											size="xs"
											variant={
												decisions[m.id] === "spectator" ? "default" : "outline"
											}
											onClick={() => {
												onDecide(m.id, "spectator");
												onOptOut(m.id, true);
											}}
										>
											Espectador
										</Button>
									</div>
								</div>
							))}
							<div>
								<Button size="sm" onClick={onAdvance}>
									{advanced ? "Ya en Presentes ✓" : "Avisar y avanzar"}
								</Button>
							</div>
						</div>
					)}
				</section>
			)}

			{!isModeratorView && (
				<header className="flex flex-col gap-1">
					<h1 className="font-heading text-2xl font-semibold">Preguntas</h1>
					<p className="text-sm text-muted-foreground">
						{ready.length} con pregunta
						{miss.length > 0 && ` · faltan ${miss.length}`}
					</p>
				</header>
			)}

			<div className="grid gap-6 md:grid-cols-3">
				<section className="flex flex-col gap-2">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Listos ({ready.length})
					</h2>
					{ready.map((m) => (
						<p key={m.id} className="text-sm">
							{m.name}
							{m.id === youId && (
								<span className="text-muted-foreground"> · Vos</span>
							)}
						</p>
					))}
					{ready.length === 0 && (
						<p className="text-xs text-muted-foreground">Nadie todavía.</p>
					)}
				</section>
				<section className="flex flex-col gap-2">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Les falta ({miss.length})
					</h2>
					{miss.map((m) => (
						<p key={m.id} className="text-sm">
							{m.name}
							{m.id === youId && (
								<span className="text-muted-foreground"> · Vos</span>
							)}
						</p>
					))}
					{miss.length === 0 && (
						<p className="text-xs text-muted-foreground">Nadie.</p>
					)}
				</section>
				<section className="flex flex-col gap-2">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Espectadores ({spectators.length})
					</h2>
					{spectators.map((m) => (
						<p key={m.id} className="text-sm">
							{m.name}
							{m.questionCount > 0 && (
								<span className="text-muted-foreground"> · a memoria</span>
							)}
						</p>
					))}
				</section>
			</div>

			<section className="flex flex-col gap-3 border-t border-border pt-6">
				<div className="flex items-center gap-1.5">
					<h2 className="text-base font-medium">Tu pregunta</h2>
					<InfoButton title={COPY.privateTitle} description={COPY.private} />
				</div>
				<textarea
					className="min-h-20 rounded-md border border-border bg-card p-3 text-sm"
					placeholder="Escribila o corregí la enviada…"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
				/>
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">
						{you.questionCount} enviada{you.questionCount === 1 ? "" : "s"}
					</span>
					<div className="flex gap-2">
						{you.role === "member" && (
							<Button
								size="sm"
								variant="ghost"
								onClick={() => onOptOut(youId, true)}
							>
								Solo miro
							</Button>
						)}
						<Button
							size="sm"
							disabled={!draft.trim()}
							onClick={() => {
								onSaveMine(draft);
								setDraft("");
							}}
						>
							Enviar
						</Button>
					</div>
				</div>
			</section>
		</main>
	);
}
