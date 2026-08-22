"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

const VARIANTS = ["A", "B", "C"] as const;

function PrototypeContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const current = searchParams.get("variant") ?? "A";

	const idx = VARIANTS.indexOf(current as (typeof VARIANTS)[number]);
	const prev = () =>
		router.replace(
			`?variant=${VARIANTS[(idx - 1 + VARIANTS.length) % VARIANTS.length]}`,
		);
	const next = () =>
		router.replace(`?variant=${VARIANTS[(idx + 1) % VARIANTS.length]}`);

	return (
		<div className="min-h-screen bg-background pb-20">
			<header className="border-b border-border px-6 py-4">
				<p className="text-muted-foreground text-sm">
					Prototipo — Insignias ·{" "}
					<span className="text-foreground font-medium">
						Variante {current}
					</span>
				</p>
			</header>

			{current === "A" && <VariantA />}
			{current === "B" && <VariantB />}
			{current === "C" && <VariantC />}

			{/* Floating switcher */}
			<nav className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5 shadow-lg">
				<button
					type="button"
					onClick={prev}
					className="text-muted-foreground hover:text-foreground transition-colors"
					aria-label="Variante anterior"
				>
					←
				</button>
				<span className="min-w-[140px] text-center text-sm font-medium text-foreground">
					{current === "A" && "A — Chips compactos"}
					{current === "B" && "B — Tarjetas de logro"}
					{current === "C" && "C — Vitrina"}
				</span>
				<button
					type="button"
					onClick={next}
					className="text-muted-foreground hover:text-foreground transition-colors"
					aria-label="Variante siguiente"
				>
					→
				</button>
			</nav>
		</div>
	);
}

export default function InsigniasPrototype() {
	return (
		<Suspense>
			<PrototypeContent />
		</Suspense>
	);
}
