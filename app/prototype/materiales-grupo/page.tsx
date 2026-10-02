/**
 * Tres variantes de Materiales del grupo, switchable via `?variant=`,
 * en la ruta throwaway /prototype/materiales-grupo.
 * Pregunta: ¿qué estructura devuelve calma editorial a la estantería
 * sin perder sorteo/pacto ni postulación 1×formato? Sin persistencia.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

const VARIANTS = ["A", "B", "C"] as const;
const NAMES = {
	A: "A — Sobremesa editorial",
	B: "B — Ritual en tres tiempos",
	C: "C — Mesa dividida",
} as const;

function PrototypeContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const current = (searchParams.get("variant") ??
		"A") as (typeof VARIANTS)[number];
	const idx = Math.max(0, VARIANTS.indexOf(current));

	const go = useCallback(
		(i: number) => {
			const next = VARIANTS[(i + VARIANTS.length) % VARIANTS.length];
			router.replace(`?variant=${next}`);
		},
		[router],
	);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			const t = e.target as HTMLElement;
			if (
				t.tagName === "INPUT" ||
				t.tagName === "TEXTAREA" ||
				t.isContentEditable
			)
				return;
			if (e.key === "ArrowLeft") go(idx - 1);
			if (e.key === "ArrowRight") go(idx + 1);
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [idx, go]);

	return (
		<div className="min-h-screen bg-background pb-24">
			<div className="mx-auto w-full max-w-6xl px-5 pt-6 md:px-8">
				<p className="text-xs text-muted-foreground">
					Prototipo throwaway · Materiales del grupo · no muta datos reales
				</p>
			</div>

			{current === "A" && <VariantA />}
			{current === "B" && <VariantB />}
			{current === "C" && <VariantC />}

			{process.env.NODE_ENV !== "production" && (
				<div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-lg">
					<button
						type="button"
						aria-label="Variante anterior"
						className="rounded-full px-2 py-1 hover:bg-muted"
						onClick={() => go(idx - 1)}
					>
						←
					</button>
					<span className="text-xs font-medium tabular-nums">
						{NAMES[VARIANTS[idx]]}
					</span>
					<button
						type="button"
						aria-label="Variante siguiente"
						className="rounded-full px-2 py-1 hover:bg-muted"
						onClick={() => go(idx + 1)}
					>
						→
					</button>
				</div>
			)}
		</div>
	);
}

export default function MaterialesGrupoPrototypePage() {
	return (
		<Suspense>
			<PrototypeContent />
		</Suspense>
	);
}
