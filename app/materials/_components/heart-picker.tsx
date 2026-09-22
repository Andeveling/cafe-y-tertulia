"use client";

import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
	/** Corazón actual del usuario (1-5) o null si no ha votado. */
	value: number | null;
	/**
	 * Qué se puntúa ("Cómo estuvo la exposición de …" / "Cómo estuvo la
	 * pregunta de …"). Visible siempre y nombre accesible del grupo;
	 * opcional solo para no romper prototipos — producción siempre lo pasa.
	 */
	label?: string;
	/** true si el usuario no puede votar (auto-voto o fase congelada). */
	disabled?: boolean;
	onVote: (value: number) => void;
};

const VALUES = [1, 2, 3, 4, 5];

/**
 * Votador de corazones: radiogroup APG (flechas + roving tabindex),
 * preview por hover solo como refuerzo visual del estado anunciado.
 * El `label` visible (qué se puntúa) es el nombre accesible del grupo.
 * Memoizado: el tick del reloj (500 ms) no lo toca.
 */
export const HeartPicker = memo(function HeartPicker({
	value,
	label,
	disabled = false,
	onVote,
}: Props) {
	const [hovered, setHovered] = useState<number | null>(null);
	const refs = useRef<Array<HTMLButtonElement | null>>([]);
	const labelId = useId();

	function focusValue(n: number) {
		refs.current[n - 1]?.focus();
	}

	function handleKeyDown(e: React.KeyboardEvent, n: number) {
		let next: number | null = null;
		if (e.key === "ArrowRight" || e.key === "ArrowDown")
			next = n >= 5 ? 1 : n + 1;
		else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
			next = n <= 1 ? 5 : n - 1;
		else if (e.key === "Home") next = 1;
		else if (e.key === "End") next = 5;
		if (next == null) return;
		e.preventDefault();
		focusValue(next);
	}

	return (
		<div className="flex flex-col items-center gap-2">
			<p
				id={labelId}
				className="text-label-sm font-bold tracking-[0.1em] text-muted-foreground uppercase"
			>
				{label}
			</p>
			<div
				className="flex items-center justify-center gap-1"
				role="radiogroup"
				aria-labelledby={labelId}
			>
			{VALUES.map((n) => {
				const active = (hovered ?? value ?? 0) >= n;
				// Roving tabindex: el valor actual (o 1 si no hay voto) es la parada de tab.
				const tabbed = (value ?? 1) === n;
				return (
					<Button
						key={n}
						ref={(el) => {
							refs.current[n - 1] = el;
						}}
						variant="ghost"
						size="icon"
						disabled={disabled}
						role="radio"
						aria-checked={value === n}
						aria-label={`${n} ${n === 1 ? "corazón" : "corazones"}`}
						tabIndex={tabbed ? 0 : -1}
						className={cn(
							"size-11 transition-colors",
							active ? "text-primary" : "text-muted-foreground/50",
						)}
						onMouseEnter={() => setHovered(n)}
						onMouseLeave={() => setHovered(null)}
						onFocus={() => setHovered(null)}
						onClick={() => onVote(n)}
						onKeyDown={(e) => handleKeyDown(e, n)}
					>
						<HugeiconsIcon
							icon={FavouriteIcon}
							strokeWidth={active ? 2 : 1.5}
							className="size-6"
							aria-hidden="true"
						/>
					</Button>
				);
			})}
			</div>
		</div>
	);
});
