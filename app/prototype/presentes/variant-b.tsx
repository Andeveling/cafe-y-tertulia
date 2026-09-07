/**
 * B — Editorial
 * Dos capítulos. Primero vos (tarea). Después el grupo (contexto).
 * El sorteo es una frase, no un botón. Cero cards.
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

export function VariantB({ members, onPresent, onOptOut }: Props) {
	const people = members.filter((m) => m.role === "member");
	const spectators = members.filter((m) => m.role === "spectator");
	const you = people.find((m) => m.isYou);
	const ready = people.filter(isReady).length;

	return (
		<main className="mx-auto flex w-full max-w-2xl flex-col px-5 py-8 md:px-8">
			<section className="flex flex-col gap-6 pb-16">
				<div className="flex items-center gap-1.5">
					<h1 className="font-heading text-3xl font-medium tracking-tight">
						¿Estás en la tertulia?
					</h1>
					<InfoButton title={COPY.listoTitle} description={COPY.listo} />
				</div>

				{you && !you.present ? (
					<Button size="lg" onClick={onPresent}>
						Estoy aquí
					</Button>
				) : (
					<p className="text-sm text-muted-foreground">
						Confirmaste tu asistencia.
					</p>
				)}

				{you?.present && (
					<div className="flex max-w-md items-start gap-3 text-sm leading-snug">
						<label className="flex items-start gap-3">
							<Switch
								className="mt-0.5"
								checked={!you.optOut}
								onCheckedChange={(v) => onOptOut(!v)}
							/>
							<span>Quiero que me toque una pregunta en el sorteo.</span>
						</label>
						<InfoButton
							title={COPY.sorteoTitle}
							description={COPY.sorteo}
						/>
					</div>
				)}
			</section>

			<section className="flex flex-col gap-6">
				<div>
					<p className="font-heading text-4xl font-medium tabular-nums">
						{ready}
						<span className="text-muted-foreground">/{people.length}</span>
					</p>
					<p className="mt-1 text-sm text-muted-foreground">listos para el sorteo</p>
				</div>

				<ul className="flex flex-col gap-4">
					{people.map((m) => (
						<li key={m.id} className="flex items-baseline justify-between gap-4">
							<span className="text-sm">
								{m.name}
								{m.isYou && (
									<span className="text-muted-foreground"> · Vos</span>
								)}
							</span>
							<span className="text-sm text-muted-foreground">
								{isReady(m)
									? m.optOut
										? "Listo · sin pregunta asignada"
										: "Listo"
									: !m.present
										? "Falta confirmar"
										: "Falta pregunta"}
							</span>
						</li>
					))}
				</ul>

				{spectators.length > 0 && (
					<p className="text-xs text-muted-foreground">
						Mirando: {spectators.map((s) => s.name).join(", ")}
					</p>
				)}
			</section>
		</main>
	);
}
