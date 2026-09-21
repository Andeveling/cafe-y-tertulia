/**
 * Tres variantes de Preguntas, switchable via ?variant=
 * Pregunta: tablero por rol + avance del Moderador avisando a faltantes.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { StageBar } from "@/app/materials/_components/stage-bar";
import {
	type AdvanceDecision,
	convocable,
	INITIAL,
	missing,
	type ProtoMember,
} from "./data";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

const VARIANTS = ["A", "B", "C"] as const;
const NAMES = {
	A: "A — Tablero único",
	B: "B — Comando",
	C: "C — Mi pregunta primero",
} as const;

export type SharedProps = {
	members: ProtoMember[];
	youId: string;
	isModeratorView: boolean;
	onSeeAs: (id: string) => void;
	onSaveMine: (text: string) => void;
	onOptOut: (id: string, next: boolean) => void;
	onConvocar: (id: string) => void;
	decisions: AdvanceDecision;
	onDecide: (id: string, d: "wait" | "spectator") => void;
	onAdvance: () => void;
	advanced: boolean;
};

function PrototypeContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const current = (searchParams.get("variant") ??
		"A") as (typeof VARIANTS)[number];
	const idx = Math.max(0, VARIANTS.indexOf(current));

	const [members, setMembers] = useState<ProtoMember[]>(INITIAL);
	const [youId, setYouId] = useState("u-andres");
	const [decisions, setDecisions] = useState<AdvanceDecision>({});
	const [advanced, setAdvanced] = useState(false);

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

	const you = members.find((m) => m.id === youId) ?? members[0];

	function patch(id: string, p: Partial<ProtoMember>) {
		setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));
	}

	const props: SharedProps = {
		members,
		youId,
		isModeratorView: you.isModerator,
		onSeeAs: setYouId,
		onSaveMine: () => patch(youId, { questionCount: you.questionCount + 1 }),
		onOptOut: (id, next) => patch(id, { role: next ? "spectator" : "member" }),
		onConvocar: (id) => patch(id, { inRoom: true }),
		decisions,
		onDecide: (id, d) => setDecisions((prev) => ({ ...prev, [id]: d })),
		onAdvance: () => setAdvanced(true),
		advanced,
	};

	const state = {
		you: you.name,
		moderatorView: props.isModeratorView,
		missing: missing(members).map((m) => m.name),
		convocable: convocable(members).map((m) => m.name),
		decisions,
		advanced,
		questions: Object.fromEntries(
			members.map((m) => [m.name, m.questionCount]),
		),
		roles: Object.fromEntries(members.map((m) => [m.name, m.role])),
	};

	return (
		<div className="min-h-screen bg-background pb-24">
			<div className="mx-auto w-full max-w-4xl px-5 pt-6 md:px-8">
				<p className="text-xs text-muted-foreground">
					Prototipo throwaway · Preguntas · no muta datos reales
				</p>
				<div className="mt-4">
					<StageBar current="questions" />
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
								{m.name}
								{m.isModerator ? " (moderador)" : ""}
								{m.role === "spectator" ? " (espectador)" : ""}
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

export default function PreguntasPrototypePage() {
	return (
		<Suspense>
			<PrototypeContent />
		</Suspense>
	);
}
