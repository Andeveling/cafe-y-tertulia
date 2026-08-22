/**
 * Variante B — Tarjetas de logro
 *
 * Cards con emoji prominente, nombre, descripción y contexto de obtención.
 * Para una sección dedicada "Mis insignias" en el perfil.
 */
import { BADGES, type BadgeData, EARNED, UNEARNED } from "./data";

function BadgeCard({ badge }: { badge: BadgeData }) {
	return (
		<div
			className={`relative flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all ${
				badge.earned
					? "border-secondary/60 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5"
					: "border-border/50 bg-muted/30 opacity-50 grayscale"
			}`}
		>
			<span className="text-4xl leading-none">{badge.emoji}</span>
			<p className="text-sm font-semibold text-foreground">{badge.name}</p>
			<p className="text-xs text-muted-foreground leading-snug">
				{badge.description}
			</p>
			{badge.earned && badge.context && (
				<p className="mt-1 text-xs text-secondary-foreground font-medium bg-secondary/40 rounded-full px-2 py-0.5">
					{badge.context}
				</p>
			)}
			{!badge.earned && (
				<span className="text-xs text-muted-foreground italic">Por lograr</span>
			)}
		</div>
	);
}

export function VariantB() {
	return (
		<main className="mx-auto max-w-3xl space-y-10 px-6 py-10">
			<div>
				<h2 className="font-heading text-2xl text-foreground">
					B — Tarjetas de logro
				</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Grid de cards. Emoji grande, nombre, descripción y contexto. Para
					sección dedicada del perfil.
				</p>
			</div>

			{/* Perfil */}
			<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
				<div className="flex items-center gap-4 mb-6">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
						ML
					</div>
					<div>
						<p className="text-lg font-semibold text-foreground">María López</p>
						<p className="text-sm text-muted-foreground">
							4 de 6 insignias individuales · 1 de 3 hitos
						</p>
					</div>
				</div>

				{/* Individuales */}
				<div className="space-y-4">
					<h3 className="font-heading text-lg text-foreground">
						Insignias individuales
					</h3>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{BADGES.filter((b) => b.kind === "individual").map((b) => (
							<BadgeCard key={b.key} badge={b} />
						))}
					</div>
				</div>

				{/* Hitos colectivos */}
				<div className="mt-8 space-y-4">
					<h3 className="font-heading text-lg text-foreground">
						Hitos del club
					</h3>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{BADGES.filter((b) => b.kind === "collective").map((b) => (
							<BadgeCard key={b.key} badge={b} />
						))}
					</div>
				</div>
			</div>

			{/* Superficie: cierre de sesión */}
			<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
				<h3 className="font-heading text-lg text-foreground mb-4">
					En cierre de sesión — hoy
				</h3>
				<div className="flex gap-3">
					<div className="flex flex-col items-center gap-1.5 rounded-xl border border-secondary/60 bg-secondary/10 p-4 text-center shadow-xs">
						<span className="text-3xl">🔥</span>
						<p className="text-xs font-semibold text-foreground">
							Cambio de perspectiva
						</p>
						<p className="text-xs text-muted-foreground">→ Carlos</p>
					</div>
					<div className="flex flex-col items-center gap-1.5 rounded-xl border border-secondary/60 bg-secondary/10 p-4 text-center shadow-xs">
						<span className="text-3xl">🧠</span>
						<p className="text-xs font-semibold text-foreground">
							Memoria de elefante
						</p>
						<p className="text-xs text-muted-foreground">→ Ana</p>
					</div>
				</div>
			</div>
		</main>
	);
}
