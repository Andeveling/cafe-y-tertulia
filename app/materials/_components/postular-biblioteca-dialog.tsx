"use client";

import {
	Book01Icon,
	News01Icon,
	PodcastIcon,
	Video01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { PostularButton } from "@/app/materials/_components/postular-buttons";
import type { BibliotecaItem } from "@/app/materials/_lib/biblioteca-store";
import {
	MATERIAL_KIND_LABELS,
	type MaterialKind,
} from "@/app/materials/_lib/constants";
import { canNominate } from "@/app/materials/_lib/postulacion";
import type { Postulacion } from "@/app/materials/_lib/postulacion-store";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

const KIND_ICON: Record<MaterialKind, typeof Book01Icon> = {
	book: Book01Icon,
	video: Video01Icon,
	podcast: PodcastIcon,
	article: News01Icon,
};

/**
 * La biblioteca es privada. No vive en la estantería: se abre para
 * postular, con el cupo 1×formato visible en cada candidato.
 */
export function PostularBibliotecaDialog({
	biblioteca,
	postulaciones,
	memberId,
	groupId,
	slug,
}: {
	biblioteca: BibliotecaItem[];
	postulaciones: Postulacion[];
	memberId: string;
	groupId: string;
	slug: string;
}) {
	const candidates = postulaciones
		.filter((postulacion) => postulacion.proposed_by === memberId)
		.map((postulacion) => ({
			kind: postulacion.kind,
			status: postulacion.status,
			proposedBy: postulacion.proposed_by,
		}));

	return (
		<Dialog>
			<DialogTrigger
				render={<Button className="min-h-11 w-full sm:w-auto">Postular</Button>}
			/>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="font-heading text-2xl">
						Tu biblioteca
					</DialogTitle>
					<DialogDescription>Como máximo 1 por formato.</DialogDescription>
				</DialogHeader>
				{biblioteca.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Guarda candidatos en{" "}
						<Link
							href="/library"
							className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
						>
							tu biblioteca
						</Link>{" "}
						para postularlos aquí.
					</p>
				) : (
					<ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
						{biblioteca.map((item) => {
							const quota = canNominate(candidates, item.kind, memberId);
							const blockReason = quota.ok ? undefined : quota.error;
							return (
								<li
									key={item.id}
									className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
								>
									<HugeiconsIcon
										icon={KIND_ICON[item.kind]}
										className="size-5 shrink-0 text-muted-foreground"
										aria-hidden
									/>
									<div className="flex min-w-0 flex-1 flex-col">
										<p className="truncate font-medium">{item.title}</p>
										<p className="text-sm text-muted-foreground">
											{item.author} · {MATERIAL_KIND_LABELS[item.kind]}
											{blockReason ? ` · ${blockReason}` : ""}
										</p>
									</div>
									<PostularButton
										libraryItemId={item.id}
										groupId={groupId}
										slug={slug}
										disabled={!quota.ok}
										disabledReason={blockReason}
									/>
								</li>
							);
						})}
					</ul>
				)}
			</DialogContent>
		</Dialog>
	);
}
