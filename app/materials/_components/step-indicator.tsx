import type { HugeiconsIconProps } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

type StepVariant = "completed" | "active" | "planned";
const variantStyles: Record<StepVariant, { bg: string; iconColor: string }> = {
	completed: {
		bg: "bg-muted",
		iconColor: "text-muted-foreground",
	},
	active: {
		bg: "bg-primary",
		iconColor: "text-primary-foreground",
	},
	planned: {
		bg: "bg-secondary",
		iconColor: "text-secondary-foreground",
	},
};
/**
 * Indicador circular reutilizable para steppers.
 * Muestra un icono centrado dentro de un círculo con estilo por variante.
 */
export function StepIndicator({
	icon,
	variant = "planned",
	size = "md",
	className,
}: {
	icon: HugeiconsIconProps["icon"];
	variant?: StepVariant;
	size?: "sm" | "md" | "lg";
	className?: string;
}) {
	const sizes = {
		sm: { container: "size-10", icon: "size-5" },
		md: { container: "size-12", icon: "size-6" },
		lg: { container: "size-14", icon: "size-7" },
	}[size];

	const styles = variantStyles[variant];

	return (
		<div
			aria-hidden="true"
			className={cn(
				"relative z-[1] grid shrink-0 place-items-center rounded-full",
				sizes.container,
				styles.bg,
				className,
			)}
		>
			<HugeiconsIcon
				icon={icon}
				className={cn(sizes.icon, styles.iconColor)}
				aria-hidden="true"
			/>
		</div>
	);
}
