import { StarHalfIcon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

type RatingDisplayProps = {
	value: number | null;
	count: number;
	size?: "sm" | "lg";
	className?: string;
};

const displayConfig = {
	sm: {
		iconSize: 14,
		className: "gap-1.5 text-xs",
		valueClassName: "font-medium text-foreground",
	},
	lg: {
		iconSize: 24,
		className: "gap-3",
		valueClassName: "text-3xl font-semibold",
	},
} as const;

/**
 * Muestra el resumen de un rating con cinco estrellas accesibles.
 * Los decimales se expresan con media estrella; el número conserva el
 * promedio de una decimal y el conteo evita que el icono cargue solo con el
 * significado del dato.
 */
export function RatingDisplay({
	value,
	count,
	size = "sm",
	className,
}: RatingDisplayProps) {
	if (count <= 0) {
		return (
			<span className={cn("text-xs text-muted-foreground/60", className)}>
				sin votos
			</span>
		);
	}

	if (value == null) {
		return (
			<span className={cn("text-xs text-muted-foreground", className)}>
				— · {count} {count === 1 ? "voto" : "votos"}
			</span>
		);
	}

	const config = displayConfig[size];
	const boundedValue = Math.min(5, Math.max(0, value));
	const fullStars = Math.floor(boundedValue);
	const hasHalfStar = boundedValue % 1 > 0;
	const voteLabel = count === 1 ? "voto" : "votos";

	return (
		<span
			role="img"
			aria-label={`Rating ${value.toFixed(1)} de 5, ${count} ${voteLabel}`}
			className={cn(
				"inline-flex items-center tabular-nums text-muted-foreground",
				config.className,
				className,
			)}
		>
			<span className="inline-flex items-center gap-0.5" aria-hidden="true">
				{Array.from({ length: 5 }, (_, index) => {
					const isFull = index < fullStars;
					const isHalf = !isFull && index === fullStars && hasHalfStar;
					return (
						<HugeiconsIcon
							key={index}
							icon={isHalf ? StarHalfIcon : StarIcon}
							size={config.iconSize}
							strokeWidth={1.75}
							className={cn(
								isFull || isHalf
									? "text-secondary-foreground"
									: "text-muted-foreground/25",
							)}
						/>
					);
				})}
			</span>
			<span className={config.valueClassName}>{value.toFixed(1)}</span>
			<span>
				· {count} {voteLabel}
			</span>
		</span>
	);
}
