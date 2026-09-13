import type { SessionStatus } from "./constants";

/**
 * Etiqueta del botón de avance según estado (grill sesión-inicio Q3/Q5).
 * La tarjeta del material es pasiva: estas etiquetas solo se usan en la Sala.
 */
export const SESSION_LIFECYCLE_LABELS: Record<
	Exclude<SessionStatus, "archived">,
	string
> = {
	preparation: "Abrir sala",
	lobby: "Empezar tertulia",
	in_progress: "Cerrar sesión",
	closed: "Archivar",
};
