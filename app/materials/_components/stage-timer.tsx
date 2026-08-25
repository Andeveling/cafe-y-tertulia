"use client";

import { useEffect, useState } from "react";
import {
	EXTEND_SECONDS,
	elapsedSeconds,
} from "@/app/materials/_lib/intervention";
import { Button } from "@/components/ui/button";

function fmt(total: number) {
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
	/** Ancla compartida (ISO). Todos los clientes leen el mismo origen. */
	startedAt: string;
	suggestedSeconds: number;
	showExtend: boolean;
	showPause?: boolean;
};

export function StageTimer({
	startedAt,
	suggestedSeconds,
	showExtend,
	showPause = false,
}: Props) {
	const startedMs = Date.parse(startedAt);
	const [extra, setExtra] = useState(0);
	const [elapsed, setElapsed] = useState(() =>
		elapsedSeconds(startedMs, Date.now()),
	);
	const [paused, setPaused] = useState(false);
	const [pauseMs, setPauseMs] = useState(0);

	useEffect(() => {
		if (paused) return;
		const id = setInterval(() => {
			setElapsed(elapsedSeconds(startedMs + pauseMs, Date.now()));
		}, 500);
		return () => clearInterval(id);
	}, [startedMs, paused, pauseMs]);

	function handlePause() {
		if (!paused) {
			setPaused(true);
			return;
		}
		// ponytail: pause/extend stay local; sync if the club actually uses them
		const frozen = elapsed;
		setPaused(false);
		setPauseMs(Date.now() - startedMs - frozen * 1000);
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
