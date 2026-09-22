/**
 * Tres variantes de cards de Sala, switchable via ?variant=
 * Pregunta: una sola composición (Avatar + primer nombre + estado)
 * para unificar room/sala: quién entró, listo, sorteo, convocatoria.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { StageBar } from "@/app/materials/_components/stage-bar";
import { INITIAL, type ProtoSalaMember } from "./data";
import type { SharedProps } from "./props";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

const VARIANTS = ["A", "B", "C"] as const;
const NAMES = {
	A: "A — La Mesa",
	B: "B — Pase de lista",
	C: "C — Quién está",
} as const;

function PrototypeContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const current = (searchParams.get("variant") ??
		"A") as (typeof VARIANTS)[number];
	const idx = Math.max(0, VARIANTS.indexOf(current));

	const [members, setMembers] = useState<ProtoSalaMember[]>(INITIAL);
	const [youId, setYouId] = useState("u-andres");

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

	function patch(id: string, p: Partial<ProtoSalaMember>) {
		setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));
	}

	const you = members.find((m) => m.id === youId) ?? members[0];

	const props: SharedProps = {
		members,
		youId,
		isModeratorView: you.isModerator,
		onSeeAs: setYouId,
		onConvocar: (id) =>
			patch(id, { inRoom: true, estado: "en_sesion", online: true }),
		onToggleSpectator: (id) => {
			const m = members.find((x) => x.id === id);
			if (!m) return;
			patch(id, { role: m.role === "spectator" ? "member" : "spectator" });
		},
	};

	const state = {
		variant: current,
		you: you.displayName,
		moderatorView: props.isModeratorView,
		inRoom: members.filter((m) => m.inRoom).map((m) => m.displayName),
		convocable: members
			.filter((m) => m.online && !m.inRoom)
			.map((m) => m.displayName),
		roles: Object.fromEntries(members.map((m) => [m.displayName, m.role])),
		ready: members
			.filter((m) => m.inRoom && m.role === "member" && m.hasQuestion)
			.map((m) => m.displayName),
	};

	return (
		<div className="min-h-screen bg-background pb-24">
			<div className="mx-auto w-full max-w-4xl px-5 pt-6 md:px-8">
				<p className="text-xs text-muted-foreground">
					Prototipo throwaway · Sala · no muta datos reales
				</p>
				<div className="mt-4">
					<StageBar current="presence" />
				</div>
				<label className="mt-4 flex items-center gap-2 text-sm">
					Ver como
					<select
						className="rounded-md border border-border bg-card px-2 py-1 text-sm"
						value={youId}
						onChange={(e) => setYouId(e.target.value)}
					>
						{members.map((m) => (
							<option key={m.id} value={m.id}>
								{m.displayName}
								{m.isModerator ? " (modera)" : ""}
								{m.role === "spectator" ? " (mira)" : ""}
							</option>
						))}
					</select>
				</label>
			</div>

			{current === "A" && <VariantA {...props} />}
			{current === "B" && <VariantB {...props} />}
			{current === "C" && <VariantC {...props} />}

			<pre className="mx-auto mt-8 max-w-4xl overflow-x-auto px-5 text-xs text-muted-foreground md:px-8">
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

export default function SalaPrototypePage() {
	return (
		<Suspense>
			<PrototypeContent />
		</Suspense>
	);
}
