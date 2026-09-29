import Link from "next/link";
import { BibliotecaForm } from "@/app/library/_components/biblioteca-form";
import { BibliotecaItemDelete } from "@/app/library/_components/biblioteca-item-delete";
import { MaterialCover } from "@/app/materials/_components/material-cover";
import type { BibliotecaItem } from "@/app/materials/_lib/biblioteca-store";
import { MATERIAL_KIND_LABELS } from "@/app/materials/_lib/constants";
import { Button } from "@/components/ui/button";

/** Portada del candidato: imagen real si carga, inicial si no. */
function Cover({ item }: { item: BibliotecaItem }) {
	return (
		<MaterialCover
			src={item.image_url}
			alt=""
			className="h-16 w-12 shrink-0 rounded-md"
			fallback={
				<div
					aria-hidden
					className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-muted font-heading text-xl text-primary"
				>
					{item.title.trim().charAt(0).toUpperCase() || "·"}
				</div>
			}
		/>
	);
}

/**
 * Vista de Mi biblioteca (variante A del prototype: mesa lateral).
 * El formulario completo vive fijo a la izquierda; la colección se
 * hojea a la derecha. Presentacional: los datos entran por props.
 */
export function LibraryView({ items }: { items: BibliotecaItem[] }) {
	return (
		<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 md:px-8">
			<header className="flex flex-col gap-2">
				<h1 className="font-heading text-3xl font-semibold text-balance">
					Mi biblioteca
				</h1>
				<p className="max-w-[65ch] text-base text-muted-foreground">
					Tus candidatos privados. Solo tú los ves; el grupo solo verá lo que
					postules.
					{items.length > 0 && ` ${items.length} guardados.`}
				</p>
			</header>

			<div className="grid gap-8 lg:grid-cols-[340px_1fr]">
				<aside className="lg:sticky lg:top-6 lg:self-start">
					<div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
						<h2 className="font-heading text-lg font-semibold">
							Guardar candidato
						</h2>
						<BibliotecaForm />
					</div>
				</aside>

				<section aria-label="Candidatos" className="flex flex-col gap-4">
					{items.length === 0 ? (
						<div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center">
							<p className="text-sm text-muted-foreground">
								Aún no guardas candidatos. Completa lo esencial a la izquierda y
								pulsa Guardar.
							</p>
						</div>
					) : (
						<ul className="flex flex-col gap-3">
							{items.map((item) => (
								<li
									key={item.id}
									className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
								>
									<Cover item={item} />
									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<p className="font-medium">{item.title}</p>
										<p className="text-xs text-muted-foreground">
											{item.author} · {MATERIAL_KIND_LABELS[item.kind]}
										</p>
										{item.motive && (
											<p className="line-clamp-2 text-sm text-muted-foreground">
												{item.motive}
											</p>
										)}
										{item.source_url && (
											<a
												href={item.source_url}
												target="_blank"
												rel="noreferrer"
												className="w-fit text-xs text-primary underline-offset-4 hover:underline"
											>
												Fuente
											</a>
										)}
										<div className="mt-2 flex gap-2">
											<Button
												size="sm"
												variant="secondary"
												render={<Link href="/g" />}
											>
												Postular
											</Button>
											<BibliotecaItemDelete id={item.id} />
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</main>
	);
}
