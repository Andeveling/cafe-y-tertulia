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
};

/** Remount con key al cambiar de fase (reinicia reloj). */
export function StageTimer({ suggestedSeconds, showExtend }: Props) {
	const [anchor] = useState(() => Date.now());
	const [extra, setExtra] = useState(0);
	const [elapsed, setElapsed] = useState(0);

	useEffect(() => {
		const id = setInterval(() => {
			setElapsed(Math.floor((Date.now() - anchor) / 1000));
		}, 500);
		return () => clearInterval(id);
	}, [anchor]);

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
	);
}
