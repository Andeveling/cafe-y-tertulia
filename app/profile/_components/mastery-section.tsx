import { MasteryStrip } from "@/components/mastery-strip";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getMemberMastery } from "@/lib/member-mastery";
import { createClient } from "@/lib/supabase/server";

export function MasterySkeleton() {
	return (
		<div
			role="status"
			aria-label="Cargando maestrías"
			className="mt-12 rounded-xl border border-border/60 bg-card p-6 motion-safe:animate-pulse"
		>
			<div className="h-6 w-1/4 rounded-lg bg-muted" />
			<div className="mt-4 flex flex-col gap-3">
				<div className="h-16 rounded-xl bg-muted" />
				<div className="h-16 rounded-xl bg-muted" />
			</div>
			<span className="sr-only">Cargando maestrías…</span>
		</div>
	);
}

/** Maestrías con avance. Error → null (sin sección); sin puntos → empty en la tira. Hace stream con Suspense. */
export async function MasterySection({ memberId }: { memberId: string }) {
	const supabase = await createClient();
	const mastery = await getMemberMastery(supabase, memberId).catch(() => []);
	if (mastery.length === 0) return null;

	return (
		<section aria-labelledby="maestrias-heading" className="mt-12">
			<Card>
				<CardHeader>
					<div className="min-w-0">
						<CardTitle className="font-heading text-xl">
							<h2 id="maestrias-heading">Maestrías</h2>
						</CardTitle>
						<CardDescription>
							Tu recorrido por categoría, de por vida.
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					<MasteryStrip
						items={mastery.map((m) => ({
							categoryId: m.category.id,
							categoryName: m.category.name,
							level: m.level,
							points: m.points,
						}))}
					/>
				</CardContent>
			</Card>
		</section>
	);
}
