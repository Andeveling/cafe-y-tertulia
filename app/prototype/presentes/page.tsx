"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { StageBar } from "@/app/materials/_components/stage-bar";
import { INITIAL, isReady, type ProtoMember } from "./data";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

const VARIANTS = ["A", "B", "C"] as const;
const NAMES = {
	A: "A — Quiet",
	B: "B — Editorial",
	C: "C — Utilitarian",
} as const;

/**
 * Tres variantes de Presentes, switchable via ?variant=
 * Pregunta: cómo exponer presencia + listo + opt-out del sorteo
 * sin que “Sin sorteo” compita con “Estoy presente”.
 */
function PrototypeContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const current = (searchParams.get("variant") ?? "A") as (typeof VARIANTS)[number];
	const idx = Math.max(0, VARIANTS.indexOf(current));

	const [members, setMembers] = useState<ProtoMember[]>(INITIAL);

	function go(i: number) {
		const next = VARIANTS[(i + VARIANTS.length) % VARIANTS.length];
		router.replace(`?variant=${next}`);
	}

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			const t = e.target as HTMLElement;
			if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
				return;
			if (e.key === "ArrowLeft") go(idx - 1);
			if (e.key === "ArrowRight") go(idx + 1);
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [idx]);

	function onPresent() {
		setMembers((prev) =>
			prev.map((m) => (m.isYou ? { ...m, present: true } : m)),
		);
	}

	function onOptOut(next: boolean) {
		setMembers((prev) =>
			prev.map((m) => (m.isYou ? { ...m, optOut: next } : m)),
		);
	}

	const you = members.find((m) => m.isYou);
	const ready = members.filter(isReady).length;

	const props = { members, onPresent, onOptOut };

	return (
		<div className="min-h-screen bg-background pb-24">
			<div className="mx-auto w-full max-w-4xl px-5 pt-6 md:px-8">
				<p className="text-xs text-muted-foreground">
					Prototipo throwaway · Presentes · no muta datos reales
				</p>
				<div className="mt-4">
					<StageBar current="presence" />
				</div>
			</div>

			{current === "A" && <VariantA {...props} />}
			{current === "B" && <VariantB {...props} />}
			{current === "C" && <VariantC {...props} />}

			<pre className="mx-auto mt-8 max-w-4xl px-5 text-xs text-muted-foreground md:px-8">
				vos.present={String(you?.present)} · vos.optOut={String(you?.optOut)} ·
				listos={ready}
			</pre>

			{process.env.NODE_ENV !== "production" && (
				<nav className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5 shadow-lg">
					<button
						type="button"
						onClick={() => go(idx - 1)}
						className="text-muted-foreground transition-colors hover:text-foreground"
						aria-label="Variante anterior"
					>
						←
					</button>
					<span className="min-w-[160px] text-center text-sm font-medium">
						{NAMES[current] ?? NAMES.A}
					</span>
					<button
						type="button"
						onClick={() => go(idx + 1)}
						className="text-muted-foreground transition-colors hover:text-foreground"
						aria-label="Variante siguiente"
					>
						→
					</button>
				</nav>
			)}
		</div>
	);
}

export default function PresentesPrototype() {
	return (
		<Suspense>
			<PrototypeContent />
		</Suspense>
	);
}
