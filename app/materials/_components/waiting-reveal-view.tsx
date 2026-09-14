"use client";

import { Button } from "@/components/ui/button";

type Props = {
	nextAssigneeName: string;
	youNext: boolean;
	isModerator: boolean;
	/** "Turno 1 de 2" o null cuando no hay progreso. */
	progressText: string | null;
	/** "Revelar pregunta 1 para Ana". */
	revealLabel: string;
	pending?: boolean;
	onReveal?: () => void;
};

/**
 * WaitingRevealView — pausa entre turnos del Debate.
 * Vista pura: sin Supabase ni mutaciones, solo props. La página/caller
 * aporta `onReveal` (revealNext) y `pending`.
 */
export function WaitingRevealView({
	nextAssigneeName,
	youNext,
	isModerator,
	progressText,
	revealLabel,
	pending = false,
	onReveal,
}: Props) {
	const statusLine = youNext
		? "Te toca en un momento · la pregunta sigue oculta."
		: isModerator
			? "La pregunta sigue oculta hasta que la reveles."
			: "Espera a que el moderador la revele.";

	return (
		<div className="flex flex-col items-start gap-3 py-8 text-left">
			{progressText && (
				<p className="text-xs tabular-nums text-muted-foreground">
					{progressText}
				</p>
			)}
			<p className="text-sm text-muted-foreground">{statusLine}</p>
			<p className="font-heading text-3xl font-semibold lg:text-4xl">
				{nextAssigneeName}
			</p>
			{isModerator && onReveal && (
				<div className="flex w-full flex-col items-start gap-2 border-t border-border/60 pt-4">
					<Button disabled={pending} onClick={onReveal}>
						{revealLabel}
					</Button>
					<p className="text-xs text-muted-foreground">
						La verán todos. No se puede des-revelar.
					</p>
				</div>
			)}
		</div>
	);
}
