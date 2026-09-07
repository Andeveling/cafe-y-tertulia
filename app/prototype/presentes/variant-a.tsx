/**
 * A — Quiet
 * La lista ES la etapa. Sin card anidada, sin barra de acciones.
 * Tu fila lleva el único CTA. El sorteo es un switch en tu fila, no un botón rival.
 */
"use client";

import { InfoButton } from "@/components/info-button";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { COPY, isReady, type ProtoMember } from "./data";

type Props = {
	members: ProtoMember[];
	onPresent: () => void;
	onOptOut: (next: boolean) => void;
};

export function VariantA({ members, onPresent, onOptOut }: Props) {
	const people = members.filter((m) => m.role === "member");
	const spectators = members.filter((m) => m.role === "spectator");
	const ready = people.filter(isReady).length;
	const you = people.find((m) => m.isYou);

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-8 md:px-8">
			<header className="flex flex-col gap-1">
				<div className="flex items-center gap-1.5">
					<h1 className="font-heading text-2xl font-semibold">Presentes</h1>
					<InfoButton title={COPY.listoTitle} description={COPY.listo} />
				</div>
				<p className="text-sm text-muted-foreground">
					{ready} de {people.length} listos
				</p>
			</header>

			<ul className="flex flex-col">
				{people.map((m) => {
					const readyNow = isReady(m);
					return (
						<li
							key={m.id}
							className="flex flex-col gap-3 border-b border-border py-5 last:border-b-0"
						>
							<div className="flex items-baseline justify-between gap-4">
								<div className="flex flex-col gap-0.5">
									<span className="text-sm">
										{m.name}
										{m.isYou && (
											<span className="text-muted-foreground"> · Vos</span>
										)}
									</span>
									<span className="text-xs text-muted-foreground">
										{readyNow
											? "Listo"
											: !m.present
												? "Aún no confirmó"
												: "Falta pregunta"}
									</span>
								</div>
								{m.optOut && (
									<span className="text-xs text-muted-foreground">
										Fuera del sorteo
									</span>
								)}
							</div>

							{m.isYou && !m.present && (
								<div>
									<Button onClick={onPresent}>Estoy aquí</Button>
								</div>
							)}

							{m.isYou && m.present && you && (
								<div className="flex items-center gap-2.5 text-sm">
									<label className="flex items-center gap-2.5">
										<Switch
											checked={!you.optOut}
											onCheckedChange={(v) => onOptOut(!v)}
											size="sm"
										/>
										<span>Quiero una pregunta en el sorteo</span>
									</label>
									<InfoButton
										title={COPY.sorteoTitle}
										description={COPY.sorteo}
									/>
								</div>
							)}
						</li>
					);
				})}
			</ul>

			{spectators.length > 0 && (
				<p className="text-xs text-muted-foreground">
					Espectadores: {spectators.map((s) => s.name).join(", ")}
				</p>
			)}
		</main>
	);
}
