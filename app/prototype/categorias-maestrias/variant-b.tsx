// PROTOTYPE — Variante B: pasaporte del Miembro. La maestría manda; etiquetar vive
// en el mini-form de nueva sesión (con o sin material).
// Estructura: perfil primero, acción de etiquetar al final — inverso a la variante A.

"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CATEGORIES, levelFor, MOCK_ME } from "./data";

export function VariantB() {
	const [withMaterial, setWithMaterial] = useState(true);
	const [picked, setPicked] = useState<string[]>(["actualidad"]);
	const toggle = (id: string) =>
		setPicked((p) => (p.includes(id) ? p.filter((c) => c !== id) : [...p, id]));

	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
			<div>
				<h2 className="font-heading text-3xl font-semibold">{MOCK_ME.name}</h2>
				<p className="mt-1 text-muted-foreground">
					Pasaporte de maestrías — de por vida, por categoría.
				</p>
			</div>
			{CATEGORIES.map((c) => {
				const pts = MOCK_ME.points[c.id] ?? 0;
				const lv = levelFor(pts);
				const pct = lv.next
					? Math.min(100, Math.round((pts / lv.next) * 100))
					: 100;
				return (
					<div key={c.id}>
						<div className="mb-1 flex items-baseline justify-between">
							<span className="font-medium">
								<HugeiconsIcon
									icon={c.icon}
									size={14}
									data-icon="inline-start"
								/>{" "}
								{c.name}
							</span>
							<span className="text-sm text-muted-foreground">
								<HugeiconsIcon
									icon={lv.icon}
									size={18}
									data-icon="inline-start"
								/>{" "}
								{lv.name} · {pts} pts{lv.next ? ` → ${lv.next}` : " · tope"}
							</span>
						</div>
						<Progress value={pct} />
					</div>
				);
			})}
			<Card>
				<CardHeader>
					<CardTitle className="font-heading text-xl">Nueva sesión</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex gap-2">
						<Button
							size="sm"
							variant={withMaterial ? "default" : "outline"}
							onClick={() => setWithMaterial(true)}
						>
							Con material
						</Button>
						<Button
							size="sm"
							variant={withMaterial ? "outline" : "default"}
							onClick={() => setWithMaterial(false)}
						>
							Tema libre
						</Button>
					</div>
					{withMaterial ? (
						<p className="text-sm text-muted-foreground">
							Hereda las categorías del material — aquí no se etiqueta.
						</p>
					) : (
						<Field>
							<FieldLabel>Categorías de la sesión (opcional)</FieldLabel>
							<div className="flex flex-wrap gap-2">
								{CATEGORIES.map((c) => {
									const on = picked.includes(c.id);
									return (
										<button
											key={c.id}
											type="button"
											onClick={() => toggle(c.id)}
										>
											<Badge variant={on ? "default" : "outline"}>
												<HugeiconsIcon
													icon={c.icon}
													size={14}
													data-icon="inline-start"
												/>{" "}
												{c.name}
											</Badge>
										</button>
									);
								})}
							</div>
						</Field>
					)}
					<Field>
						<FieldLabel>Rango cubierto</FieldLabel>
						<Input placeholder='Ej. "Capítulos 1-3"' className="bg-card" />
					</Field>
					<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
						{JSON.stringify(
							withMaterial
								? { mode: "con-material", categories: "heredadas" }
								: { mode: "tema-libre", session_categories: picked },
							null,
							1,
						)}
					</pre>
				</CardContent>
			</Card>
		</div>
	);
}
