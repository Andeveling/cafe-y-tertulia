"use client";

/**
 * PROTOTYPE — throwaway.
 *
 * Switcher flotante para mover entre variantes sin cambiar el route. Idéntico
 * en los dos sub-shapes; vive en un componente compartido para reusar.
 */

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

const VARIANTS = [
	{ key: "A", name: "Reloj al tope" },
	{ key: "B", name: "Header + footer (divisores)" },
	{ key: "C", name: "Label + reloj pequeño" },
] as const;

export function PrototypeSwitcher() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const current = (params.get("variant") ?? "A").toUpperCase();
	const idx = VARIANTS.findIndex((v) => v.key === current);
	const idxSafe = idx < 0 ? 0 : idx;

	const go = useCallback(
		(next: string) => {
			const p = new URLSearchParams(window.location.search);
			p.set("variant", next);
			router.replace(`${pathname}?${p.toString()}`, { scroll: false });
		},
		[pathname, router],
	);

	// Flechas ← / → ciclan variantes; respeta inputs y contenteditables.
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			const target = e.target as HTMLElement | null;
			if (!target) return;
			const tag = target.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable)
				return;
			const len = VARIANTS.length;
			if (e.key === "ArrowRight") {
				e.preventDefault();
				go(VARIANTS[(idxSafe + 1) % len].key);
			}
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				go(VARIANTS[(idxSafe - 1 + len) % len].key);
			}
		}
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [idxSafe, go]);

	// No aparece en producción — el prototipo no se envía a usuarios reales.
	if (process.env.NODE_ENV === "production") return null;

	const currentVariant = VARIANTS[idxSafe];

	return (
		<div
			role="region"
			aria-label="Selector de variante (prototipo)"
			className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-foreground/15 bg-popover/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
		>
			<div className="flex items-center gap-1.5">
				<button
					type="button"
					aria-label="Variante anterior"
					onClick={() =>
						go(VARIANTS[(idxSafe - 1 + VARIANTS.length) % VARIANTS.length].key)
					}
					className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
				>
					<HugeiconsIcon
						icon={ArrowLeft01Icon}
						strokeWidth={2}
						className="size-3.5"
						aria-hidden="true"
					/>
				</button>
				<span className="min-w-[12rem] text-center font-mono text-xs text-muted-foreground">
					<span className="font-bold text-foreground">
						{currentVariant.key}
					</span>
					{" · "}
					{currentVariant.name}
				</span>
				<button
					type="button"
					aria-label="Siguiente variante"
					onClick={() => go(VARIANTS[(idxSafe + 1) % VARIANTS.length].key)}
					className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
				>
					<HugeiconsIcon
						icon={ArrowRight01Icon}
						strokeWidth={2}
						className="size-3.5"
						aria-hidden="true"
					/>
				</button>
			</div>
		</div>
	);
}
