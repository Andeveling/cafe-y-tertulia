"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export type DrawWheelPerson = { id: string; name: string };
export type DrawCycleEdge = { fromId: string; toId: string };

type Props = {
	people: DrawWheelPerson[];
	rotationDeg: number;
	spinning: boolean;
	locked?: boolean;
	edges?: DrawCycleEdge[];
	reduced?: boolean;
};

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? "";
	const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
	return (first + last).toUpperCase() || "·";
}

function firstName(name: string) {
	return name.trim().split(/\s+/)[0] ?? "";
}

function polar(r: number, deg: number) {
	const a = ((deg - 90) * Math.PI) / 180;
	return [100 + r * Math.cos(a), 100 + r * Math.sin(a)] as const;
}

function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

function shorten(
	from: readonly [number, number],
	to: readonly [number, number],
	t = 0.3,
) {
	return [
		lerp(from[0], to[0], t),
		lerp(from[1], to[1], t),
		lerp(from[0], to[0], 1 - t),
		lerp(from[1], to[1], 1 - t),
	] as const;
}

export function DrawWheel({
	people,
	rotationDeg,
	spinning,
	locked = false,
	edges = [],
	reduced = false,
}: Props) {
	const markerId = useId().replace(/:/g, "");
	const unique = people.filter((p) => p.id && p.name);
	const n = unique.length;
	const idle = !spinning && !locked && !reduced;
	const indexById = new Map(unique.map((p, i) => [p.id, i]));
	const countLabel = n ? `${n} ${n === 1 ? "persona" : "personas"}` : "vacío";

	return (
		<div
			role="img"
			aria-label={
				spinning
					? "Ciclo del sorteo girando"
					: locked
						? "Ciclo del sorteo, parejas"
						: `Ciclo del sorteo, ${countLabel}`
			}
			className="relative mx-auto size-56 sm:size-64"
		>
			<div
				className={cn(
					"absolute inset-0 rounded-full bg-muted/40 ring-1 ring-foreground/15",
					(spinning || locked) && "ring-primary/35",
				)}
			>
				<motion.div
					key={spinning ? "spin" : idle ? "idle" : "rest"}
					className="absolute inset-0"
					style={
						spinning || locked
							? { transform: `rotate(${rotationDeg}deg)` }
							: undefined
					}
					animate={idle ? { rotate: [-4, 4] } : undefined}
					transition={
						idle
							? {
									duration: 5.5,
									repeat: Infinity,
									repeatType: "mirror",
									ease: "easeInOut",
								}
							: undefined
					}
				>
					<svg viewBox="0 0 200 200" className="size-full">
						<defs>
							<marker
								id={markerId}
								markerWidth="7"
								markerHeight="7"
								refX="6"
								refY="3.5"
								orient="auto"
							>
								<path d="M0,0 L7,3.5 L0,7 Z" className="fill-primary" />
							</marker>
						</defs>
						<circle
							cx="100"
							cy="100"
							r="68"
							fill="none"
							className="stroke-foreground/15"
							strokeWidth="1.5"
						/>
						{locked
							? edges.map((e) => {
									const i = indexById.get(e.fromId);
									const j = indexById.get(e.toId);
									if (i == null || j == null || n === 0) return null;
									const a0 = (i / n) * 360;
									const a1 = (j / n) * 360;
									const [x1, y1, x2, y2] = shorten(
										polar(68, a0),
										polar(68, a1),
									);
									return (
										<line
											key={`${e.fromId}-${e.toId}`}
											x1={x1}
											y1={y1}
											x2={x2}
											y2={y2}
											className="stroke-primary"
											strokeWidth="1.75"
											markerEnd={`url(#${markerId})`}
										/>
									);
								})
							: null}
						{unique.map((p, i) => {
							const deg = n === 0 ? 0 : (i / n) * 360;
							const [cx, cy] = polar(68, deg);
							const [tx, ty] = polar(92, deg);
							return (
								<g key={p.id}>
									<circle
										cx={cx}
										cy={cy}
										r="14"
										className="fill-background stroke-primary/40"
										strokeWidth="1.5"
									/>
									<text
										x={cx}
										y={cy}
										textAnchor="middle"
										dominantBaseline="middle"
										className="fill-foreground"
										style={{ fontSize: 8, fontWeight: 700 }}
									>
										{initials(p.name)}
									</text>
									<text
										x={tx}
										y={ty}
										textAnchor="middle"
										dominantBaseline="middle"
										className="fill-foreground"
										style={{ fontSize: 9, fontWeight: 600 }}
										transform={`rotate(${-rotationDeg} ${tx} ${ty})`}
									>
										{firstName(p.name)}
									</text>
								</g>
							);
						})}
					</svg>
				</motion.div>
			</div>
		</div>
	);
}
