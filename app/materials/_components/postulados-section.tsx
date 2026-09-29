import Link from "next/link";
import {
	PostularButton,
	RetirarPostulacionButton,
} from "@/app/materials/_components/postular-buttons";
import { listBiblioteca } from "@/app/materials/_lib/biblioteca-store";
import { MATERIAL_KIND_LABELS } from "@/app/materials/_lib/constants";
import { canNominate } from "@/app/materials/_lib/postulacion";
import { listPostulaciones } from "@/app/materials/_lib/postulacion-store";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type PostuladosProps = {
	groupId: string;
	slug: string;
	memberId: string;
};

/**
 * Postular desde mi Biblioteca hacia el Grupo activo (#88).
 * Muestra solo mis candidatos con el cupo 1×formato visible:
 * si ya tengo una activa en ese formato, el botón se desactiva.
 */
async function PostularDesdeBiblioteca({
	groupId,
	slug,
	memberId,
}: PostuladosProps) {
	const [biblioteca, postulaciones] = await Promise.all([
		listBiblioteca(),
		listPostulaciones(groupId),
	]);
	const candidates = postulaciones
		.filter((p) => p.proposed_by === memberId)
		.map((p) => ({
			kind: p.kind,
			status: p.status,
			proposedBy: p.proposed_by,
		}));

	if (biblioteca.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				Guarda candidatos en{" "}
				<Link href="/profile" className="underline">
					tu biblioteca
				</Link>{" "}
				para postularlos aquí.
			</p>
		);
	}

	return (
		<ul className="flex flex-col gap-3">
			{biblioteca.map((item) => {
				const check = canNominate(candidates, item.kind, memberId);
				return (
					<li
						key={item.id}
						className="flex items-start justify-between gap-4 rounded-lg border p-3"
					>
						<div className="flex min-w-0 flex-col gap-1">
							<p className="truncate font-medium">{item.title}</p>
							<p className="text-xs text-muted-foreground">
								{item.author} · {MATERIAL_KIND_LABELS[item.kind]}
							</p>
							{!check.ok && (
								<p className="text-xs text-muted-foreground">{check.error}</p>
							)}
						</div>
						<PostularButton
							libraryItemId={item.id}
							groupId={groupId}
							slug={slug}
							disabled={!check.ok}
							disabledReason={!check.ok ? check.error : undefined}
						/>
					</li>
				);
			})}
		</ul>
	);
}

/**
 * Sección Postulados del Grupo (#88): solo lo postulado, nunca
 * bibliotecas completas. Cada Miembro puede retirar lo suyo.
 */
export async function PostuladosSection({
	groupId,
	slug,
	memberId,
}: PostuladosProps) {
	const postulaciones = await listPostulaciones(groupId);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">
					<h2>Postulados</h2>
				</CardTitle>
				<CardDescription>
					Lo que los Miembros ofrecen para lo que sigue. Cada uno postula como
					máximo 1 por formato.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				{postulaciones.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Todavía no hay postulados en este grupo.
					</p>
				) : (
					<ul className="flex flex-col gap-3">
						{postulaciones.map((p) => (
							<li
								key={p.id}
								className="flex items-start justify-between gap-4 rounded-lg border p-3"
							>
								<div className="flex min-w-0 flex-col gap-1">
									<p className="truncate font-medium">{p.title}</p>
									<p className="text-xs text-muted-foreground">
										{p.author} · {MATERIAL_KIND_LABELS[p.kind]}
									</p>
								</div>
								{p.proposed_by === memberId && (
									<RetirarPostulacionButton nominationId={p.id} slug={slug} />
								)}
							</li>
						))}
					</ul>
				)}

				<div className="flex flex-col gap-3 border-t pt-6">
					<h3 className="text-sm font-medium">Postular desde mi biblioteca</h3>
					<PostularDesdeBiblioteca
						groupId={groupId}
						slug={slug}
						memberId={memberId}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
