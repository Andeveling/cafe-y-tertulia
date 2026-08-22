/**
 * Variante A — Chips compactos
 *
 * Insignias como chips inline con emoji + nombre. Hover revela detalle.
 * Pensada para espacios ajustados: header de perfil, tarjetas de sesión, cierre.
 */
import { BADGES, EARNED, UNEARNED } from "./data";

function Chip({
	emoji,
	name,
	earned,
}: {
	emoji: string;
	name: string;
	earned: boolean;
}) {
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
				earned
					? "bg-secondary text-secondary-foreground shadow-xs hover:shadow-sm hover:scale-105"
					: "bg-muted/50 text-muted-foreground opacity-45 grayscale"
			}`}
			title={name}
		>
			<span className="text-base">{emoji}</span>
			<span className="hidden sm:inline">{name}</span>
		</span>
	);
}

function Section({ title, badges }: { title: string; badges: typeof BADGES }) {
	return (
		<section className="space-y-3">
			<h3 className="font-heading text-lg text-foreground">{title}</h3>
			<div className="flex flex-wrap gap-2">
				{badges.map((b) => (
					<Chip key={b.key} emoji={b.emoji} name={b.name} earned={b.earned} />
				))}
			</div>
		</section>
	);
}

export function VariantA() {
	return (
		<main className="mx-auto max-w-2xl space-y-10 px-6 py-10">
			<div>
				<h2 className="font-heading text-2xl text-foreground">
					A — Chips compactos
				</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Inline, mínimo. Funciona en headers, tarjetas y cierre de sesión.
				</p>
			</div>

			{/* Perfil de ejemplo */}
			<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
				<div className="flex items-center gap-4">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
						ML
					</div>
					<div>
						<p className="text-lg font-semibold text-foreground">María López</p>
						<p className="text-sm text-muted-foreground">
							Miembro desde junio 2026 · 9 sesiones
						</p>
					</div>
				</div>
				<div className="mt-5 space-y-3">
					<Section title="Insignias" badges={EARNED} />
					{UNEARNED.length > 0 && (
						<Section title="Por descubrir" badges={UNEARNED} />
					)}
				</div>
			</div>

			{/* Superficie: cierre de sesión */}
			<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
				<h3 className="font-heading text-lg text-foreground mb-3">
					En cierre de sesión
				</h3>
				<p className="text-sm text-muted-foreground mb-4">
					Las insignias otorgadas hoy aparecen como chips destacados:
				</p>
				<div className="flex flex-wrap gap-2">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground shadow-sm ring-2 ring-secondary/50">
						<span className="text-base">🔥</span>
						<span>Cambio de perspectiva</span>
					</span>
					<span className="text-sm text-muted-foreground self-center">
						→ otorgada a Carlos por Ana
					</span>
				</div>
			</div>
		</main>
	);
}
