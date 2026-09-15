/**
 * Estado de presencia (CONTEXT.md + ADR 0010).
 * Puro y testeable: sin React ni Supabase.
 */

export type EstadoPresencia =
	| "en_linea"
	| "en_sesion"
	| "ausente"
	| "desconectado";

/** Umbrales del acuerdo: 5 min → ausente, 90 s gracia → desconectado. */
export const UMBRAL_AUSENTE_MS = 5 * 60_000;
export const UMBRAL_DESCONECTADO_MS = 90_000;
export const HEARTBEAT_MS = 30_000;

export function resuelveEstado(args: {
	vivo: boolean;
	enSala: boolean;
	ultimaActividad: number;
	ahora: number;
}): EstadoPresencia {
	if (!args.vivo) return "desconectado";
	// Dentro de Sala nunca se marca Ausente aunque esté quieto (debate).
	if (args.enSala) return "en_sesion";
	if (args.ahora - args.ultimaActividad >= UMBRAL_AUSENTE_MS) return "ausente";
	return "en_linea";
}

/** Solo En línea y Ausente aceptan Convocatoria (ADR 0010). */
export function puedeLlamar(estado: EstadoPresencia): boolean {
	return estado === "en_linea" || estado === "ausente";
}

const ORDEN: Record<EstadoPresencia, number> = {
	en_sesion: 0,
	en_linea: 1,
	ausente: 2,
	desconectado: 3,
};

/** Orden estable por grupo de estado y luego por nombre. */
export function ordenaPorEstado<
	T extends { display_name: string; estado: EstadoPresencia },
>(miembros: T[]): T[] {
	return [...miembros].sort((a, b) => {
		if (a.estado !== b.estado) return ORDEN[a.estado] - ORDEN[b.estado];
		return a.display_name.localeCompare(b.display_name);
	});
}

/** Etiqueta corta de última vez para Desconectado. */
export function formateaUltimaVez(
	ultimaVez: number | null | undefined,
	ahora: number,
): string {
	if (!ultimaVez) return "nunca";
	const diff = ahora - ultimaVez;
	if (diff < 60_000) return "ahora mismo";
	if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)} min`;
	if (diff < 24 * 3_600_000) return `hace ${Math.floor(diff / 3_600_000)} h`;
	return `hace ${Math.floor(diff / (24 * 3_600_000))} d`;
}
