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
			className="mt-12 animate-pulse rounded-xl border border-border/60 bg-card p-6"
		>
			<div className="h-6 w-1/4 rounded-lg bg-muted" />
			<div className="mt-4 flex gap-2">
				<div className="h-8 w-32 rounded-full bg-muted" />
				<div className="h-8 w-32 rounded-full bg-muted" />
			</div>
			<span className="sr-only">Cargando…</span>
		</div>
	);
}

/** Maestrías por categoría. Vacío → null (sin sección). Hace stream con Suspense. */
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
