// PROTOTYPE — Variante A: ficha de Material. Etiquetar inline + tira de maestrías.
// Estructura: el material manda; las maestrías son contexto secundario.

"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES, levelFor, MOCK_MATERIAL, MOCK_ME } from "./data";

export function VariantA() {
	const [picked, setPicked] = useState<string[]>(MOCK_MATERIAL.categories);
	const toggle = (id: string) =>
		setPicked((p) => (p.includes(id) ? p.filter((c) => c !== id) : [...p, id]));

	return (
		<div className="mx-auto max-w-4xl px-6 py-8">
			<Card>
				<CardHeader>
					<p className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
						{MOCK_MATERIAL.status}
					</p>
					<CardTitle className="font-heading text-3xl">
						{MOCK_MATERIAL.title}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-5">
					<div>
						<p className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
							Categorías — toca para etiquetar
						</p>
						<div className="flex flex-wrap gap-2">
							{CATEGORIES.map((c) => {
								const on = picked.includes(c.id);
								return (
									<button key={c.id} type="button" onClick={() => toggle(c.id)}>
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
					</div>
					<div className="border-t pt-4">
						<p className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
							Tu maestría en estas categorías
						</p>
						<div className="flex flex-wrap gap-2">
							{picked.map((id) => {
								const cat = CATEGORIES.find((c) => c.id === id);
								const lv = levelFor(MOCK_ME.points[id] ?? 0);
								return (
									<Badge
										key={id}
										variant="secondary"
										className="py-1.5 text-sm"
									>
										<HugeiconsIcon
											icon={lv.icon}
											size={18}
											data-icon="inline-start"
										/>{" "}
										{cat?.name} · {lv.name}
									</Badge>
								);
							})}
							{picked.length === 0 && (
								<span className="text-sm text-muted-foreground">
									Sin categorías — sin maestría que mostrar.
								</span>
							)}
						</div>
					</div>
					<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
						{JSON.stringify({ material_categories: picked }, null, 1)}
					</pre>
				</CardContent>
			</Card>
		</div>
	);
}
