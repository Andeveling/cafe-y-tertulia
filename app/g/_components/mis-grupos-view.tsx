import { CreateGroupForm } from "@/app/g/_components/create-group-form";
import { GroupCard } from "@/app/g/_components/group-card";
import { PublicCatalog } from "@/app/g/_components/public-catalog";
import type { MyGroup, PublicGroupCard } from "@/lib/groups/types";

/**
 * Vista de Mis Grupos: mis grupos con presencia por grupo + catálogo
 * público de descubrimiento. Patrón room-panel-harness: presentacional,
 * testeable sin Supabase.
 */
export function MisGruposView({
	myGroups,
	catalog,
	startCreating = false,
}: {
	myGroups: MyGroup[];
	catalog: PublicGroupCard[];
	startCreating?: boolean;
}) {
	return (
		<div className="flex flex-col gap-8">
			<section aria-label="Mis grupos">
				<div className="mb-3 flex items-center justify-between">
					<h1 className="font-serif text-2xl font-semibold">Mis grupos</h1>
					<CreateGroupForm startOpen={startCreating} />
				</div>
				{myGroups.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Aún no perteneces a ningún grupo. Explora el catálogo público o crea
						el tuyo.
					</p>
				) : (
					<ul className="grid gap-3 sm:grid-cols-2">
						{myGroups.map((g) => (
							<li key={g.id}>
								<GroupCard group={g} />
							</li>
						))}
					</ul>
				)}
			</section>

			<section aria-label="Catálogo público">
				<h2 className="mb-3 font-serif text-xl font-semibold">
					Catálogo público
				</h2>
				<PublicCatalog groups={catalog} />
			</section>
		</div>
	);
}
