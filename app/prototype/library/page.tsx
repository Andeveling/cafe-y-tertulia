/**
 * Tres variantes de /library, switchable via `?variant=`, en la ruta
 * throwaway /prototype/library.
 * Pregunta: ¿qué estructura hace la biblioteca hojeable sin perder
 * el guardado rápido? Estado en memoria, sin mutar datos reales.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { INITIAL, type ProtoBibliotecaItem } from "./data";
import type { BibliotecaDraft, SharedProps } from "./props";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

const VARIANTS = ["A", "B", "C"] as const;
const NAMES = {
	A: "A — Mesa lateral",
	B: "B — Vitrina",
	C: "C — Bandeja + diálogo",
} as const;

function PrototypeContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const current = (searchParams.get("variant") ??
		"A") as (typeof VARIANTS)[number];
	const idx = Math.max(0, VARIANTS.indexOf(current));

	const [items, setItems] = useState<ProtoBibliotecaItem[]>(INITIAL);

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

	function handleAdd(draft: BibliotecaDraft) {
		setItems((prev) => [
			{
				id: `proto-${Date.now()}`,
				title: draft.title,
				author: draft.author,
				kind: draft.kind,
				motive: draft.motive.trim() ? draft.motive.trim() : null,
				imageUrl: null,
				createdAt: new Date().toISOString().slice(0, 10),
			},
			...prev,
		]);
	}

	function handleDelete(id: string) {
		setItems((prev) => prev.filter((i) => i.id !== id));
	}

	const props: SharedProps = {
		items,
		onAdd: handleAdd,
		onDelete: handleDelete,
	};

	const state = {
		variant: current,
		total: items.length,
		titles: items.map((i) => i.title),
		byKind: Object.fromEntries(
			["book", "podcast", "video", "article"].map((k) => [
				k,
				items.filter((i) => i.kind === k).length,
			]),
		),
	};

	return (
		<div className="min-h-screen bg-background pb-24">
			<div className="mx-auto w-full max-w-6xl px-5 pt-6 md:px-8">
				<p className="text-xs text-muted-foreground">
					Prototipo throwaway · /library · no muta datos reales
				</p>
			</div>

			{current === "A" && <VariantA {...props} />}
			{current === "B" && <VariantB {...props} />}
			{current === "C" && <VariantC {...props} />}

			<pre className="mx-auto mt-8 max-w-6xl overflow-x-auto px-5 text-xs text-muted-foreground md:px-8">
				{JSON.stringify(state, null, 2)}
			</pre>

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

export default function LibraryPrototypePage() {
	return (
		<Suspense>
			<PrototypeContent />
		</Suspense>
	);
}
