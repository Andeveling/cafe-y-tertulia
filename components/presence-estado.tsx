import type { EstadoPresencia } from "@/lib/presencia/estado";
import { cn } from "@/lib/utils";

export const ETIQUETA_ESTADO: Record<EstadoPresencia, string> = {
	en_linea: "En línea",
	en_sesion: "En sesión",
	ausente: "Ausente",
	desconectado: "Desconectado",
};

const PUNTO: Record<EstadoPresencia, string> = {
	en_linea: "bg-primary",
	en_sesion: "bg-reward",
	ausente: "bg-muted-foreground/50",
	desconectado: "border border-muted-foreground/40 bg-transparent",
};

/** Punto + etiqueta del Estado de presencia. Solo tokens, nunca color ad-hoc. */
export function PresenceEstado({
	estado,
	detalle,
	className,
}: {
	estado: EstadoPresencia;
	detalle?: string;
	className?: string;
}) {
	return (
		<span className={cn("flex min-w-0 items-center gap-1.5", className)}>
			<span
				data-slot="presence-dot"
				role="img"
				aria-label={ETIQUETA_ESTADO[estado]}
				title={ETIQUETA_ESTADO[estado]}
				className={cn("size-2 shrink-0 rounded-full", PUNTO[estado])}
			/>
			<span className="truncate text-xs text-muted-foreground">
				{detalle ?? ETIQUETA_ESTADO[estado]}
			</span>
		</span>
	);
}
