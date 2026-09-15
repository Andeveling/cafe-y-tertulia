"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { padWheelPeople } from "@/app/materials/_lib/draw-ceremony";
import { cn } from "@/lib/utils";

export type DrawWheelPerson = { id: string; name: string };

type Props = {
	people: DrawWheelPerson[];
	rotationDeg: number;
	spinning: boolean;
	reduced?: boolean;
	hub?: ReactNode;
};

function initials(name: string) {
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? "";
	const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
	return (first + last).toUpperCase() || "·";
}

function polar(r: number, deg: number) {
	const a = ((deg - 90) * Math.PI) / 180;
	return [100 + r * Math.cos(a), 100 + r * Math.sin(a)] as const;
}

function slicePath(i: number, n: number) {
	const a0 = (i / n) * 360;
	const a1 = ((i + 1) / n) * 360;
	const [x0, y0] = polar(100, a0);
	const [x1, y1] = polar(100, a1);
	const large = a1 - a0 > 180 ? 1 : 0;
	return `M 100 100 L ${x0} ${y0} A 100 100 0 ${large} 1 ${x1} ${y1} Z`;
}

function sliceLabel(name: string, n: number) {
	if (!name) return "";
	const first = name.trim().split(/\s+/)[0] ?? "";
	if (n <= 6 && first.length <= 8) return first;
	return initials(name);
}

export function DrawWheel({
	people,
	rotationDeg,
	spinning,
	reduced = false,
	hub,
}: Props) {
	const unique = people.filter((p) => p.name);
	const slices =
		unique.length === 0
			? Array.from({ length: 6 }, (_, i) => ({ id: `empty-${i}`, name: "" }))
			: padWheelPeople(unique);
	const n = slices.length;
	const idle = !spinning && !reduced;
	const countLabel = unique.length
		? `${unique.length} ${unique.length === 1 ? "persona" : "personas"}`
		: "vacía";

	return (
		<div
			role="img"
			aria-label={
				spinning
					? "Rueda del sorteo girando"
					: `Rueda del sorteo, ${countLabel}`
			}
			className="relative mx-auto size-56 sm:size-64"
		>
			<motion.div
				aria-hidden="true"
				className="absolute -top-1 left-1/2 z-10 size-0 border-x-8 border-t-[14px] border-x-transparent border-t-primary"
				style={{ marginLeft: -8 }}
				animate={spinning && !reduced ? { rotate: [-7, 7] } : { rotate: 0 }}
				transition={
					spinning && !reduced
						? { duration: 0.1, repeat: Infinity, repeatType: "mirror" }
						: { duration: 0.2 }
				}
			/>

			<div
				className={cn(
					"absolute inset-0 rounded-full bg-muted ring-1 ring-foreground/15",
					spinning && "ring-primary/40",
				)}
			>
				<motion.div
					key={spinning ? "spin" : "idle"}
					className="absolute inset-2 overflow-hidden rounded-full"
					style={
						spinning ? { transform: `rotate(${rotationDeg}deg)` } : undefined
					}
					animate={idle ? { rotate: [-5, 5] } : undefined}
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
						{slices.map((p, i) => {
							const mid = ((i + 0.5) / n) * 360;
							const [tx, ty] = polar(62, mid);
							return (
								<g key={`${p.id}-${i}`}>
									<path
										d={slicePath(i, n)}
										className={
											i % 2 === 0 ? "fill-primary/15" : "fill-foreground/5"
										}
									/>
									{p.name ? (
										<text
											x={tx}
											y={ty}
											textAnchor="middle"
											dominantBaseline="middle"
											className="fill-foreground"
											style={{
												fontSize: n > 8 ? 8 : 11,
												fontWeight: 700,
												letterSpacing: "0.04em",
											}}
										>
											{sliceLabel(p.name, n)}
										</text>
									) : null}
								</g>
							);
						})}
						<circle
							cx="100"
							cy="100"
							r="99"
							fill="none"
							className="stroke-foreground/10"
							strokeWidth="2"
						/>
					</svg>
				</motion.div>
			</div>

			<div className="absolute inset-[31%] z-10 grid place-items-center rounded-full bg-background ring-1 ring-primary/30">
				{spinning && !reduced ? (
					<span
						aria-hidden="true"
						className="absolute -inset-1.5 animate-ping rounded-full ring-1 ring-primary/40"
					/>
				) : null}
				<span className="relative font-heading text-sm text-primary italic">
					{hub}
				</span>
			</div>
		</div>
	);
}
