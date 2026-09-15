/**
 * Módulo de sincronización de la Sala. Interfaz: mutate + subscribe +
 * apply-latest (`createSalaSync`). El actor muta, los observadores se
 * enteran, el error no refresca. FormData es detalle interno.
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
function shouldApplySnapshot(
	appliedAsOf: number,
	incomingAsOf: number,
): boolean {
	return incomingAsOf > appliedAsOf;
}

export function applyLatest<T extends { asOf: number }>(
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
function applyRoomMutationResult(
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

export type SalaFieldsMutation = {
	action: RoomFormAction;
	fields: Record<string, string>;
};

export type SalaMutation =
	| (() => Promise<RoomActionResult>)
	| SalaFieldsMutation;

export type SalaObserver = {
	notify: () => void;
	unsubscribe: () => void;
};

export type SalaSync = {
	mutate: (work: SalaMutation, onSuccess?: () => void) => Promise<void>;
	subscribe: () => SalaObserver;
	applyLatest: <T extends { asOf: number }>(held: T, incoming: T) => T;
};

function isFieldsMutation(work: SalaMutation): work is SalaFieldsMutation {
	return typeof work === "object";
}

export function createSalaSync(deps: {
	refresh: () => void;
	onError?: (error: string) => void;
	waitMs?: number;
}): SalaSync {
	const waitMs = deps.waitMs ?? ROOM_REFRESH_DEBOUNCE_MS;
	const onError = deps.onError ?? (() => {});
	return {
		async mutate(work, onSuccess) {
			const result = isFieldsMutation(work)
				? await work.action(ROOM_OK_RESULT, roomFormData(work.fields))
				: await work();
			applyRoomMutationResult(result, {
				refresh: deps.refresh,
				onError,
				onSuccess,
			});
		},
		subscribe() {
			const scheduler = createRefreshScheduler(deps.refresh, waitMs);
			return {
				notify: () => scheduler.schedule(),
				unsubscribe: () => scheduler.cancel(),
			};
		},
		applyLatest,
	};
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
const ROOM_OK_RESULT: RoomActionResult = { ok: true };

/** Arma el FormData de una acción con campos sueltos. */
function roomFormData(fields: Record<string, string>): FormData {
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
const ROOM_OFFLINE_REFETCH_MS = 4_000;
/** Backstop while live: un evento de postgres_changes perdido no congela la Sala. */
const ROOM_LIVE_HEARTBEAT_MS = 5_000;
/**
 * Colapsa ráfagas de eventos realtime (p. ej. el INSERT en draws + N
 * INSERTs en assignments del Sorteo) en un solo refresh trailing-edge.
 */
const ROOM_REFRESH_DEBOUNCE_MS = 350;

type RefreshScheduler = {
	schedule: () => void;
	cancel: () => void;
};

/** Scheduler trailing-edge puro: N schedule() seguidos disparan un solo run(). */
function createRefreshScheduler(
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
