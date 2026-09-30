import {
	Book01Icon,
	News01Icon,
	PodcastIcon,
	Video01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { RetirarPostulacionButton } from "@/app/materials/_components/postular-buttons";
import {
	MATERIAL_KIND_LABELS,
	type MaterialKind,
} from "@/app/materials/_lib/constants";
import type { Postulacion } from "@/app/materials/_lib/postulacion-store";

const KIND_ICON: Record<MaterialKind, typeof Book01Icon> = {
	book: Book01Icon,
	video: Video01Icon,
	podcast: PodcastIcon,
	article: News01Icon,
};

/**
 * Lo que sigue (#88): solo lo postulado, nunca bibliotecas completas
 * del resto. Cada Miembro puede retirar lo suyo. Postular abre la
 * biblioteca en un modal, no una segunda lista.
 */
export function PostuladosLists({
	postulaciones,
	memberId,
	slug,
}: {
	postulaciones: Postulacion[];
	memberId: string;
	slug: string;
}) {
	if (postulaciones.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-border/70 px-4 py-5">
				<p className="text-sm text-muted-foreground">
					Todavía no hay postulados en este grupo.
				</p>
			</div>
		);
	}

	return (
		<ul className="flex flex-col divide-y divide-border">
			{postulaciones.map((postulacion) => (
				<li
					key={postulacion.id}
					className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
				>
					<HugeiconsIcon
						icon={KIND_ICON[postulacion.kind]}
						className="size-5 shrink-0 text-muted-foreground"
						aria-hidden
					/>
					<div className="flex min-w-0 flex-1 flex-col">
						<p className="truncate font-medium">{postulacion.title}</p>
						<p className="text-sm text-muted-foreground">
							{postulacion.author} · {MATERIAL_KIND_LABELS[postulacion.kind]}
						</p>
					</div>
					{postulacion.proposed_by === memberId ? (
						<RetirarPostulacionButton
							nominationId={postulacion.id}
							slug={slug}
						/>
					) : null}
				</li>
			))}
		</ul>
	);
}
