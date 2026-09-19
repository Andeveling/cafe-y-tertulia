// PROTOTYPE — Variante C: mesa del club. Vista colectiva primero (matriz
// miembros × categorías con nivel), etiquetar vive en el diálogo de sesión.
// Estructura: lo colectivo manda; ni ficha ni perfil — inverso a A y B.

"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { CATEGORIES, levelFor, MOCK_ROSTER } from "./data";

export function VariantC() {
	const [open, setOpen] = useState(false);
	const [picked, setPicked] = useState<string[]>(["cine"]);
	const toggle = (id: string) =>
		setPicked((p) => (p.includes(id) ? p.filter((c) => c !== id) : [...p, id]));

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<div className="mb-5 flex items-end justify-between gap-4">
				<div>
					<h2 className="font-heading text-3xl font-semibold">Mesa del club</h2>
					<p className="mt-1 text-muted-foreground">
						Quién sabe de qué — de un vistazo.
					</p>
				</div>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger render={<Button>Nueva sesión</Button>} />
					<DialogContent>
						<DialogHeader>
							<DialogTitle className="font-heading text-2xl">
								Nueva sesión sin material
							</DialogTitle>
						</DialogHeader>
						<p className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
							Categorías (opcional)
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
						<Button onClick={() => setOpen(false)}>Crear sesión</Button>
					</DialogContent>
				</Dialog>
			</div>
			<div className="overflow-x-auto rounded-lg border">
				<table className="w-full min-w-[560px] text-left text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="px-4 py-2 font-medium">Miembro</th>
							{CATEGORIES.map((c) => (
								<th key={c.id} className="px-4 py-2 font-medium">
									{c.name}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{MOCK_ROSTER.map((m) => (
							<tr key={m.name} className="border-b last:border-0">
								<td className="px-4 py-2 font-medium">{m.name}</td>
								{CATEGORIES.map((c) => {
									const lv = levelFor(m.points[c.id] ?? 0);
									return (
										<td
											key={c.id}
											className="px-4 py-2"
											title={`${lv.name} · ${m.points[c.id] ?? 0} pts`}
										>
											<HugeiconsIcon
												icon={lv.icon}
												size={18}
												data-icon="inline-start"
											/>{" "}
											<span className="text-xs text-muted-foreground">
												{lv.name}
											</span>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="mt-2 text-xs uppercase tracking-[0.05em] text-muted-foreground">
				Nivel con icono del sistema — nada de glifos sueltos, sin color arcade
			</p>
			<pre className="mt-4 overflow-x-auto rounded-md bg-muted p-3 text-xs">
				{JSON.stringify({ dialog_categories: picked }, null, 1)}
			</pre>
		</div>
	);
}
