"use client";

import { useEffect, useState } from "react";
import { EXTEND_SECONDS } from "@/app/materials/_lib/intervention";
import { Button } from "@/components/ui/button";

function fmt(total: number) {
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
	suggestedSeconds: number;
	showExtend: boolean;
	showPause?: boolean;
};

/** Remount con key al cambiar de fase (reinicia reloj). */
export function StageTimer({
	suggestedSeconds,
	showExtend,
	showPause = false,
}: Props) {
	const [anchor] = useState(() => Date.now());
	const [extra, setExtra] = useState(0);
	const [elapsed, setElapsed] = useState(0);
	const [paused, setPaused] = useState(false);
	const [pauseOffset, setPauseOffset] = useState(0);

	useEffect(() => {
		if (paused) return;
		const id = setInterval(() => {
			setElapsed(Math.floor((Date.now() - anchor - pauseOffset) / 1000));
		}, 500);
		return () => clearInterval(id);
	}, [anchor, paused, pauseOffset]);

	function handlePause() {
		if (!paused) {
			setPaused(true);
		} else {
			// Al reanudar, compensamos el tiempo pausado.
			const pausedAt = Date.now();
			setPaused(false);
			// Usamos un truco: el offset se ajusta en el próximo tick.
			setPauseOffset(
				(prev) => prev + (pausedAt - anchor - prev - elapsed * 1000),
			);
		}
	}

	const suggested = suggestedSeconds + extra;

	return (
		<div className="flex flex-col items-center gap-2">
			<p className="font-heading text-4xl tabular-nums tracking-tight">
				{fmt(elapsed)}
				<span className="text-muted-foreground text-2xl">
					{" "}
					/ {fmt(suggested)}
				</span>
			</p>
			<p className="text-xs text-muted-foreground">Orientativo · no corta</p>
			<div className="flex gap-2">
				{showPause && (
					<Button size="sm" variant="outline" onClick={handlePause}>
						{paused ? "Reanudar" : "Pausar"}
					</Button>
				)}
				{showExtend && (
					<Button
						size="sm"
						variant="outline"
						onClick={() => setExtra((e) => e + EXTEND_SECONDS)}
					>
						Extender +1 min
					</Button>
				)}
			</div>
		</div>
	);
}
