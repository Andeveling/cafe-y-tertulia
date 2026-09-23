import { BadgeVitrina } from "@/app/profile/_components/badge-vitrina";
import { getCachedMemberBadges } from "@/app/profile/_lib/cached-badges";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export function VitrinaSkeleton() {
	return (
		<div
			role="status"
			aria-label="Cargando vitrina"
			className="animate-pulse rounded-xl border border-border/60 bg-card p-6"
		>
			<div className="h-6 w-1/3 rounded-lg bg-muted" />
			<div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
				{Array.from({ length: 6 }, (_, i) => (
					<div key={i} className="aspect-square rounded-lg bg-muted" />
				))}
			</div>
			<span className="sr-only">Cargando…</span>
		</div>
	);
}

/** Vitrina de insignias e hitos. Hace stream con Suspense. */
export async function VitrinaSection({ memberId }: { memberId: string }) {
	const { badges, recognitions } = await getCachedMemberBadges(memberId);

	return (
		<section aria-labelledby="vitrina-heading" className="mt-12">
			<Card>
				<CardHeader>
					<div className="min-w-0">
						<CardTitle className="font-heading text-xl">
							<h2 id="vitrina-heading">Vitrina de la tertulia</h2>
						</CardTitle>
						<CardDescription>
							Tus insignias y los hitos que el club consiguió contigo.
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					<BadgeVitrina badges={badges} recognitions={recognitions} />
				</CardContent>
			</Card>
		</section>
	);
}
