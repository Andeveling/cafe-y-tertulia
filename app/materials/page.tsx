import { Book01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	getMaterials,
	MATERIAL_KIND_LABELS,
	MATERIAL_STATUS_LABELS,
} from "@/lib/materials";

export const metadata = {
	title: "Materiales · Café y Tertulia",
	description: "Pipeline de materiales del club.",
};

export default async function MaterialsPage() {
	const materials = await getMaterials();

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
			<header className="flex items-center justify-between gap-4">
				<div>
					<h1 className="font-heading text-2xl font-medium">Materiales</h1>
					<p className="text-sm text-muted-foreground">
						El pipeline del club: lo propuesto, lo seleccionado y lo que ya
						conversamos.
					</p>
				</div>
				<Button render={<Link href="/materiales/nuevo" />}>
					<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
					Proponer material
				</Button>
			</header>

			{materials.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-8 text-center">
						<HugeiconsIcon
							icon={Book01Icon}
							className="text-muted-foreground"
						/>
						<p className="text-sm text-muted-foreground">
							Todavía no hay materiales. Propón el primero y el club lo
							conversa.
						</p>
					</CardContent>
				</Card>
			) : (
				<ul className="flex flex-col gap-3">
					{materials.map((material) => (
						<li key={material.id}>
							<Card>
								<CardHeader className="grid-cols-[1fr_auto]">
									<CardTitle>
										<Link href={`/materiales/${material.id}`}>
											<span className="block truncate">{material.title}</span>
											<span className="block truncate text-xs font-normal text-muted-foreground">
												{material.author} ·{" "}
												{MATERIAL_KIND_LABELS[material.kind]}
												{material.sessions_count > 0 && (
													<>
														{" · "}
														{material.sessions_count}{" "}
														{material.sessions_count === 1
															? "sesión"
															: "sesiones"}
													</>
												)}
											</span>
										</Link>
									</CardTitle>
									<Badge variant="secondary">
										{MATERIAL_STATUS_LABELS[material.status]}
									</Badge>
								</CardHeader>
							</Card>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
