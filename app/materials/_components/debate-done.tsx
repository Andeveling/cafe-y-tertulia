"use client";

import { Enter } from "@/app/materials/_components/stage-enter";

export function DebateDone({ isModerator }: { isModerator: boolean }) {
	return (
		<Enter>
			<div
				className="flex flex-col items-start gap-4 py-8 text-left"
				role="status"
				aria-live="polite"
			>
				<p className="font-heading text-2xl font-medium lg:text-3xl">
					Debate terminado
				</p>
				<p className="max-w-md text-sm text-muted-foreground">
					{isModerator
						? "Todos los turnos se completaron. En Cierre se califica el material y se cierra la sesión: ahí se actualizan conteos e insignias."
						: "Todos los turnos se completaron. Los conteos e insignias se actualizan cuando el moderador cierra la sesión en Cierre."}
				</p>
			</div>
		</Enter>
	);
}
