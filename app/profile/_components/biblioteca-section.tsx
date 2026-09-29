import { listBiblioteca } from "@/app/materials/_lib/biblioteca-store";
import { MATERIAL_KIND_LABELS } from "@/app/materials/_lib/constants";
import { BibliotecaForm } from "@/app/profile/_components/biblioteca-form";
import { BibliotecaItemDelete } from "@/app/profile/_components/biblioteca-item-delete";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

/**
 * Biblioteca personal en /profile (#88): colección privada global del
 * Miembro, solo él la ve. Desde aquí guarda candidatos para postular
 * después hacia cada Grupo.
 */
export async function BibliotecaSection() {
	const items = await listBiblioteca();

	return (
		<section aria-label="Mi biblioteca" className="mt-12">
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">
						<h2>Mi biblioteca</h2>
					</CardTitle>
					<CardDescription>
						Tus candidatos privados. Solo tú los ves; el Grupo solo verá lo que
						postules.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					<BibliotecaForm />

					{items.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Tu biblioteca empieza vacía. Guarda tu primer candidato.
						</p>
					) : (
						<ul className="flex flex-col gap-3">
							{items.map((item) => (
								<li
									key={item.id}
									className="flex items-start justify-between gap-4 rounded-lg border p-3"
								>
									<div className="flex min-w-0 flex-col gap-1">
										<p className="truncate font-medium">{item.title}</p>
										<p className="text-xs text-muted-foreground">
											{item.author} · {MATERIAL_KIND_LABELS[item.kind]}
										</p>
										{item.motive && (
											<p className="line-clamp-2 text-sm text-muted-foreground">
												{item.motive}
											</p>
										)}
									</div>
									<BibliotecaItemDelete id={item.id} />
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</section>
	);
}
