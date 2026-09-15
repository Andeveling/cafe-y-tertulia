/**
 * Instantes del reloj compartido de la Sala (Debate y Sorteo).
 *
 * El display se deriva de un ancla del servidor (`phaseStartedAt`,
 * `draws.created_at`) más este instante — nunca de un offset local — para
 * que Moderador y Participantes vean el mismo m:ss / 3-2-1.
 *
 * Orden: frozen (stories) → wallNow (Date.now() tras montar) → asOf
 * (reloj del snapshot: idéntico en SSR e hidratación) → fallback (ancla).
 */
export function sharedNow(opts: {
	frozen?: number;
	wallNow: number | null;
	asOf?: number;
	fallback?: number;
}): number {
	if (opts.frozen != null) return opts.frozen;
	if (opts.wallNow != null) return opts.wallNow;
	if (opts.asOf != null) return opts.asOf;
	return opts.fallback ?? 0;
}
