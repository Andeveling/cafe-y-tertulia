import Image from "next/image";

/**
 * Señal de navegación. Sin este fallback Next no commitea la ruta y la
 * vista anterior se queda congelada. El platillo es un círculo, así que
 * girar la marca solo se lee como la taza dando vueltas.
 */
export function ContentPending() {
	return (
		<div
			role="status"
			aria-label="Cargando"
			className="flex flex-1 items-center justify-center py-16"
		>
			<Image
				src="/brand/coffee.svg"
				alt=""
				width={80}
				height={80}
				className="size-20 origin-center motion-safe:animate-cup-turn"
				priority
			/>
		</div>
	);
}
