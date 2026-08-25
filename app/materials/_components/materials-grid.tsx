import {
	Book01Icon,
	News01Icon,
	PodcastIcon,
	Video01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { RatingDisplay } from "@/app/materials/_components/rating-display";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Duplicamos labels para no importar "server-only" (módulo ligero compartido client/server)
const MATERIAL_KIND_LABELS: Record<string, string> = {
	book: "Libro",
	podcast: "Podcast",
	video: "Video",
	article: "Artículo",
};
const MATERIAL_STATUS_LABELS: Record<string, string> = {
	proposed: "Propuesto",
	selected: "Seleccionado",
	in_progress: "En curso",
	finished: "Terminado",
};
type MaterialWithSessionsCount = {
	id: string;
	title: string;
	kind: string;
	author: string;
	status: string;
	created_at: string;
	sessions_count: number;
	rating_avg: number | null;
	rating_count: number;
};

const KIND_ICON: Record<string, typeof Book01Icon> = {
	book: Book01Icon,
	video: Video01Icon,
	podcast: PodcastIcon,
	article: News01Icon,
};

/**
 * Portadas — grid de covers (variante C ganadora).
 * Antes VariantC del prototipo; ahora vista definitiva de /materials.
 */
export function MaterialsGrid({
	materials,
}: {
	materials: MaterialWithSessionsCount[];
}) {
	return (
		<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{materials.map((m) => (
				<li key={m.id}>
					<Link href={`/materials/${m.id}`} className="block group h-full">
						<Card className="h-full overflow-hidden py-0 gap-0 hover:shadow-md transition-all hover:-translate-y-0.5">
							<div className="h-28 bg-gradient-to-br from-secondary via-secondary/60 to-accent/60 p-4 flex items-start justify-between">
								<HugeiconsIcon
									icon={KIND_ICON[m.kind] ?? Book01Icon}
									className="size-10 text-primary/40"
									aria-hidden="true"
								/>
								<Badge
									variant={m.status === "in_progress" ? "default" : "secondary"}
									className="text-xs"
								>
									{MATERIAL_STATUS_LABELS[m.status]}
								</Badge>
							</div>
							<CardContent className="flex flex-1 flex-col gap-2 px-4 py-4">
								<p className="line-clamp-2 font-medium leading-tight group-hover:text-primary transition-colors">
									{m.title}
								</p>
								<p className="text-xs text-muted-foreground">
									{m.author} · {MATERIAL_KIND_LABELS[m.kind]}
								</p>
								<div className="mt-auto flex items-center justify-between border-t pt-3">
									<span className="text-xs text-muted-foreground">
										{m.sessions_count}{" "}
										{m.sessions_count === 1 ? "sesión" : "sesiones"}
									</span>
									<RatingDisplay value={m.rating_avg} count={m.rating_count} />
								</div>
							</CardContent>
						</Card>
					</Link>
				</li>
			))}
		</ul>
	);
}

// Compat: el prototipo usaba VariantC — mantenemos alias hasta limpiar imports externos
export const VariantC = MaterialsGrid;
