import { MaterialsGrid } from "@/app/materials/_components/materials-grid";
import { PostuladosLists } from "@/app/materials/_components/postulados-section";
import { PostularBibliotecaDialog } from "@/app/materials/_components/postular-biblioteca-dialog";
import type { BibliotecaItem } from "@/app/materials/_lib/biblioteca-store";
import type {
	MaterialKind,
	MaterialStatus,
} from "@/app/materials/_lib/constants";
import type { Postulacion } from "@/app/materials/_lib/postulacion-store";

export type ShelfMaterial = {
	id: string;
	title: string;
	kind: MaterialKind;
	author: string;
	status: MaterialStatus;
	image_url: string | null;
	sessions_count: number;
	rating_avg: number | null;
	rating_count: number;
};

type GroupShelfViewProps = {
	groupName: string;
	groupId: string;
	slug: string;
	memberId: string;
	materials: ShelfMaterial[];
	postulaciones: Postulacion[];
	biblioteca: BibliotecaItem[];
};

/**
 * El catálogo es la grilla de cards. Postular no compite: vive debajo,
 * en su propia sección, no dentro de cada card.
 */
export function GroupShelfView({
	groupName,
	groupId,
	slug,
	memberId,
	materials,
	postulaciones,
	biblioteca,
}: GroupShelfViewProps) {
	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col">
			<header className="flex flex-col gap-3">
				<h1 className="font-heading text-3xl font-semibold text-balance md:text-4xl">
					La estantería de {groupName}
				</h1>
				<p className="max-w-[65ch] text-base text-muted-foreground">
					Solo crece por sorteo o pacto.
				</p>
			</header>

			<section aria-label="Materiales" className="mt-8">
				{materials.length === 0 ? (
					<div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center">
						<p className="text-sm text-muted-foreground">
							Todavía no hay materiales en este grupo.
						</p>
					</div>
				) : (
					<MaterialsGrid
						materials={materials.map((item) => ({
							...item,
							created_at: "",
							source_url: null,
						}))}
					/>
				)}
			</section>

			<section aria-label="Lo que sigue" className="mt-12 flex flex-col gap-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div className="flex flex-col gap-1">
						<h2 className="font-heading text-2xl font-semibold">
							Lo que sigue
						</h2>
						<p className="max-w-[65ch] text-sm text-muted-foreground">
							Lo que los Miembros ofrecen. Cada uno postula como máximo 1 por
							formato.
						</p>
					</div>
					<PostularBibliotecaDialog
						biblioteca={biblioteca}
						postulaciones={postulaciones}
						memberId={memberId}
						groupId={groupId}
						slug={slug}
					/>
				</div>
				<PostuladosLists
					postulaciones={postulaciones}
					memberId={memberId}
					slug={slug}
				/>
			</section>
		</div>
	);
}
