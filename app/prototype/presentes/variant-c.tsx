/**
 * C — Utilitarian
 * Tabla de estado. Columnas Nombran las reglas. Solo tu fila es control.
 * “Sin sorteo” deja de ser un CTA y pasa a ser una celda.
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

export function VariantC({ members, onPresent, onOptOut }: Props) {
	const people = members.filter((m) => m.role === "member");
	const spectators = members.filter((m) => m.role === "spectator");
	const ready = people.filter(isReady).length;
	const you = people.find((m) => m.isYou);

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-8 md:px-8">
			<header className="flex items-end justify-between gap-4">
				<div className="flex items-center gap-1.5">
					<h1 className="font-heading text-2xl font-semibold">Presentes</h1>
					<InfoButton title={COPY.listoTitle} description={COPY.listo} />
				</div>
				<p className="text-sm tabular-nums text-muted-foreground">
					{ready}/{people.length} listos
				</p>
			</header>

			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border text-left">
							<th className="py-2 pr-4 font-medium">Nombre</th>
							<th className="py-2 pr-4 font-medium">Pregunta</th>
							<th className="py-2 pr-4 font-medium">Presente</th>
							<th className="py-2 font-medium">
								<span className="inline-flex items-center gap-1">
									Sorteo
									<InfoButton
										title={COPY.sorteoTitle}
										description={COPY.sorteo}
									/>
								</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{people.map((m, i) => (
							<tr
								key={m.id}
								className={
									i % 2 === 1 ? "bg-foreground/[0.03]" : undefined
								}
							>
								<td className="py-3 pr-4">
									{m.name}
									{m.isYou && (
										<span className="text-muted-foreground"> · Vos</span>
									)}
								</td>
								<td className="py-3 pr-4 text-muted-foreground">
									{m.hasQuestion ? "Enviada" : "Pendiente"}
								</td>
								<td className="py-3 pr-4">
									{m.isYou && !m.present ? (
										<Button size="sm" onClick={onPresent}>
											Estoy aquí
										</Button>
									) : m.present ? (
										<span className="text-muted-foreground">Sí</span>
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</td>
								<td className="py-3">
									{m.isYou && m.present && you ? (
										<label className="inline-flex items-center gap-2">
											<Switch
												size="sm"
												checked={!you.optOut}
												onCheckedChange={(v) => onOptOut(!v)}
											/>
											<span className="text-muted-foreground">
												{you.optOut ? "Fuera" : "Entra"}
											</span>
										</label>
									) : m.optOut ? (
										<span className="text-muted-foreground">Fuera</span>
									) : (
										<span className="text-muted-foreground">Entra</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{spectators.length > 0 && (
				<p className="text-xs text-muted-foreground">
					Espectadores · {spectators.map((s) => s.name).join(" · ")}
				</p>
			)}
		</main>
	);
}
