"use client";

/**
 * PROTOTYPE — throwaway.
 *
 * Three-variant UI prototype for the consolidated TurnSpotlight (single card).
 * Switch variants via ?variant=A|B|C on the URL or the floating switcher.
 *
 *   A — "Reloj al tope"        : clock opens the card as visual anchor.
 *   B — "Header + footer"      : clock + label share a header row with divider;
 *                                 content centered; hearts in footer row with divider.
 *   C — "Label + reloj pequeño": label on left, miniaturized clock on right of header.
 *
 * Three variants, switchable via the URL search param (also keyboard ←/→
 * and floating bottom bar). Each variant is structurally different — not
 * just colour tweaks. Throwaway: rewritten properly when folded in.
 */

import { useSearchParams } from "next/navigation";
import { MOCK_TURN_PROPS } from "@/app/prototype/turn-spotlight/mock-data";
import {
	VariantA,
	VariantB,
	VariantC,
} from "@/app/prototype/turn-spotlight/variants";

export function PrototypeView() {
	const params = useSearchParams();
	const raw = (params.get("variant") ?? "A").toUpperCase();
	const variant = raw === "B" || raw === "C" ? raw : "A";

	return (
		<div className="min-h-dvh bg-background pb-32 pt-12">
			<div className="mx-auto max-w-3xl px-4 sm:px-6">
				<p className="mb-6 text-center font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
					Prototipo · TurnSpotlight consolidado a una sola card
				</p>

				{variant === "B" && <VariantB {...MOCK_TURN_PROPS} />}
				{variant === "C" && <VariantC {...MOCK_TURN_PROPS} />}
				{variant === "A" && <VariantA {...MOCK_TURN_PROPS} />}

				<p className="mt-8 text-center font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
					Variante {variant} · sin tocar producción
				</p>
			</div>
		</div>
	);
}
