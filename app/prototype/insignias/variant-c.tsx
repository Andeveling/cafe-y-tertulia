/**
 * Variante C — Vitrina / Colección
 *
 * Display estilo "vitrina" donde las insignias ganadas brillan y las
 * bloqueadas muestran un preview misterioso. Gamificación-forward.
 * Para perfil con énfasis en progresión.
 */
import { BADGES, type BadgeData, EARNED, UNEARNED } from "./data";

function BadgeSlot({ badge }: { badge: BadgeData }) {
	return (
		<div className="group relative flex flex-col items-center">
			{/* Glow effect for earned */}
			{badge.earned && (
				<div className="absolute -inset-1 rounded-2xl bg-secondary/30 blur-sm transition-all group-hover:bg-secondary/50 group-hover:blur-md" />
			)}
			<div
				className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-all ${
					badge.earned
						? "border-secondary bg-card shadow-md group-hover:shadow-lg group-hover:scale-105 group-hover:-translate-y-1"
						: "border-dashed border-border bg-muted/20"
				}`}
			>
				{badge.earned ? (
					<span className="text-4xl">{badge.emoji}</span>
				) : (
					<span className="text-3xl opacity-20 grayscale">❓</span>
				)}
			</div>
			<p
				className={`mt-2 text-center text-xs font-medium leading-tight ${
					badge.earned ? "text-foreground" : "text-muted-foreground"
				}`}
			>
				{badge.earned ? badge.name : "???"}
			</p>
			{badge.earned && badge.earnedDate && (
				<p className="text-[10px] text-muted-foreground">
					{new Date(badge.earnedDate).toLocaleDateString("es", {
						month: "short",
						day: "numeric",
					})}
				</p>
			)}
		</div>
	);
}

function RecognitionBanner() {
	return (
		<div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-secondary/20 via-secondary/10 to-transparent border border-secondary/40 px-5 py-3">
			<span className="text-2xl">🏅</span>
			<div>
				<p className="text-sm font-semibold text-foreground">
					Reconocimiento de la temporada
				</p>
				<p className="text-xs text-muted-foreground">
					Maestro de la trivia — Agosto 2026
				</p>
			</div>
		</div>
	);
}

export function VariantC() {
	return (
		<main className="mx-auto max-w-3xl space-y-10 px-6 py-10">
			<div>
				<h2 className="font-heading text-2xl text-foreground">C — Vitrina</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Colección con estado bloqueado. Las ganadas brillan; las pendientes
					son misteriosas. Énfasis en progresión.
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
							4 de 6 · Lectora constante
						</p>
					</div>
				</div>

				{/* Reconocimiento */}
				<RecognitionBanner />

				{/* Vitrina individual */}
				<div className="mt-8 space-y-4">
					<h3 className="font-heading text-lg text-foreground">
						Mis insignias
					</h3>
					<div className="grid grid-cols-3 gap-5 sm:grid-cols-6">
						{BADGES.filter((b) => b.kind === "individual").map((b) => (
							<BadgeSlot key={b.key} badge={b} />
						))}
					</div>
				</div>

				{/* Hitos */}
				<div className="mt-8 space-y-4">
					<h3 className="font-heading text-lg text-foreground">
						Hitos del club
					</h3>
					<div className="grid grid-cols-3 gap-5 sm:grid-cols-6">
						{BADGES.filter((b) => b.kind === "collective").map((b) => (
							<BadgeSlot key={b.key} badge={b} />
						))}
					</div>
				</div>
			</div>

			{/* Superficie: cierre de sesión */}
			<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
				<h3 className="font-heading text-lg text-foreground mb-4">
					En cierre de sesión — hoy
				</h3>
				<div className="flex items-center gap-6">
					<div className="relative flex flex-col items-center">
						<div className="absolute -inset-1 rounded-2xl bg-secondary/30 blur-sm" />
						<div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-secondary bg-card shadow-md">
							<span className="text-3xl">🔥</span>
						</div>
						<p className="mt-1.5 text-xs font-medium text-foreground">Carlos</p>
					</div>
					<div className="relative flex flex-col items-center">
						<div className="absolute -inset-1 rounded-2xl bg-secondary/30 blur-sm" />
						<div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-secondary bg-card shadow-md">
							<span className="text-3xl">🧠</span>
						</div>
						<p className="mt-1.5 text-xs font-medium text-foreground">Ana</p>
					</div>
				</div>
			</div>
		</main>
	);
}
