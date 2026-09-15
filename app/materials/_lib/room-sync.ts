/**
 * Contrato de sincronización de la Sala: mutación del actor, apply-latest
 * de snapshots solapados, y cuándo refetch al recuperar el canal.
 */

export type RoomActionResult = { ok: true } | { ok: false; error: string };

export type RoomChannelStatus =
	| "SUBSCRIBED"
	| "CHANNEL_ERROR"
	| "TIMED_OUT"
	| "CLOSED"
	| "JOINING"
	| string;

/**
 * Reloj del snapshot: se toma al empezar el fetch, no al terminar, para que
 * un RSC más lento que leyó datos viejos no pise uno más nuevo.
 */
export function snapshotAsOf(nowMs = Date.now()): number {
	return nowMs;
}

/** Un snapshot más viejo o del mismo reloj no pisa uno ya aplicado. */
export function shouldApplySnapshot(
	appliedAsOf: number,
	incomingAsOf: number,
): boolean {
	return incomingAsOf > appliedAsOf;
}

export function pickLatestRoomFrame<T extends { asOf: number }>(
	held: T,
	incoming: T,
): T {
	return shouldApplySnapshot(held.asOf, incoming.asOf) ? incoming : held;
}

export type RoomSurface = "open" | "closed" | "inactive";

/** Rama de la Sala: viva, finalizada, u otra. */
export function roomSurface(status: string): RoomSurface {
	if (status === "lobby" || status === "in_progress") return "open";
	if (status === "closed" || status === "archived") return "closed";
	return "inactive";
}

export function nextRefreshGeneration(current: number): number {
	return current + 1;
}

/** Una generación anterior no pisa una más nueva ya aplicada. */
export function shouldApplyRefresh(
	appliedGeneration: number,
	incomingGeneration: number,
): boolean {
	return incomingGeneration >= appliedGeneration;
}

/**
 * Éxito → onSuccess (opcional) y refresh del actor.
 * Error → onError y no se toma el camino de éxito.
 *
 * Único camino de mutación de la Sala: tanto la mutación directa
 * (`() => Promise<ActionResult>`, p. ej. guardar Pregunta o avanzar de
 * Etapa) como la acción con formulario (`RoomFormAction` + campos, p. ej.
 * trivia y takes) resuelven por aquí. El realtime cubre al resto de
 * dispositivos; este refresh cubre al que actúa.
 */
export function applyRoomMutationResult(
	result: RoomActionResult,
	handlers: {
		refresh: () => void;
		onError: (error: string) => void;
		onSuccess?: () => void;
	},
): void {
	if (!result.ok) {
		handlers.onError(result.error);
		return;
	}
	handlers.onSuccess?.();
	handlers.refresh();
}

/**
 * Acción de servidor con campos sueltos: recibe un resultado dummy y un
 * FormData (trivia, takes, rating). Misma forma que `ServerActionFn`.
 */
export type RoomFormAction = (
	prev: RoomActionResult,
	formData: FormData,
) => Promise<RoomActionResult>;

/** Resultado dummy para las acciones con formulario: solo leen el FormData. */
export const ROOM_OK_RESULT: RoomActionResult = { ok: true };

/** Arma el FormData de una acción con campos sueltos. */
export function roomFormData(fields: Record<string, string>): FormData {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.set(key, value);
	}
	return formData;
}

/**
 * Refetch en todo SUBSCRIBED: el join inicial puede llegar después de un
 * cambio de Etapa, y un re-subscribe recupera eventos perdidos en el corte.
 */
export function shouldRefetchOnChannelStatus(
	status: RoomChannelStatus,
	_previousStatus?: RoomChannelStatus | null,
): boolean {
	return status === "SUBSCRIBED";
}

/** Mientras el canal no está vivo, el actor y el observador no se congelan. */
export const ROOM_OFFLINE_REFETCH_MS = 4_000;
/** Backstop while live: un evento de postgres_changes perdido no congela la Sala. */
export const ROOM_LIVE_HEARTBEAT_MS = 5_000;
/**
 * Colapsa ráfagas de eventos realtime (p. ej. el INSERT en draws + N
 * INSERTs en assignments del Sorteo) en un solo refresh trailing-edge.
 */
export const ROOM_REFRESH_DEBOUNCE_MS = 350;

export type RefreshScheduler = {
	schedule: () => void;
	cancel: () => void;
};

/** Scheduler trailing-edge puro: N schedule() seguidos disparan un solo run(). */
export function createRefreshScheduler(
	run: () => void,
	waitMs: number,
): RefreshScheduler {
	let id: ReturnType<typeof setTimeout> | null = null;
	return {
		schedule() {
			if (id !== null) clearTimeout(id);
			id = setTimeout(() => {
				id = null;
				run();
			}, waitMs);
		},
		cancel() {
			if (id !== null) {
				clearTimeout(id);
				id = null;
			}
		},
	};
}

export function roomRefreshIntervalMs(joined: boolean, live: boolean): number {
	return !joined || !live ? ROOM_OFFLINE_REFETCH_MS : ROOM_LIVE_HEARTBEAT_MS;
}

export function shouldRefetchOnVisibility(visibilityState: string): boolean {
	return visibilityState === "visible";
}

export function roomChannelIsLive(status: RoomChannelStatus): boolean {
	return status === "SUBSCRIBED";
}
