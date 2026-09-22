/**
 * ¿Esta carga de la Sala debe sentar al que la abre?
 *
 * Abrir Preguntas sienta a quien aún no está. Un refresh justo después
 * de Salir también lo encuentra fuera — y sin esta marca lo vuelve a
 * sentar, así que el equipo lo sigue viendo dentro.
 */

export const LEFT_ROOM_COOKIE = "cy-left-room";
/** Ventana en la que un refresh no deshace el Salir. */
export const LEFT_ROOM_WINDOW_MS = 20_000;

export function leftRoomMarker(sessionId: string, now = Date.now()) {
	return `${sessionId}.${now}`;
}

export function leftRoomRecently(
	marker: string | null | undefined,
	sessionId: string,
	now = Date.now(),
): boolean {
	if (!marker) return false;
	const dot = marker.lastIndexOf(".");
	if (dot < 0) return false;
	const id = marker.slice(0, dot);
	const ts = Number(marker.slice(dot + 1));
	if (id !== sessionId || !Number.isFinite(ts)) return false;
	return now - ts >= 0 && now - ts < LEFT_ROOM_WINDOW_MS;
}

export function shouldSeatOnRoomLoad(input: {
	status: string;
	roomStage: string;
	seated: boolean;
	leftMarker: string | null;
	sessionId: string;
	now?: number;
}): boolean {
	if (input.seated) return false;
	if (input.status !== "lobby" || input.roomStage !== "questions") return false;
	if (
		leftRoomRecently(input.leftMarker, input.sessionId, input.now ?? Date.now())
	) {
		return false;
	}
	return true;
}

export function markLeftRoom(sessionId: string) {
	document.cookie = `${LEFT_ROOM_COOKIE}=${leftRoomMarker(sessionId)}; path=/; max-age=30; samesite=lax`;
}

export function clearLeftRoom() {
	document.cookie = `${LEFT_ROOM_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function readLeftRoomMarker(): string | null {
	const prefix = `${LEFT_ROOM_COOKIE}=`;
	const raw = document.cookie
		.split("; ")
		.find((part) => part.startsWith(prefix));
	if (!raw) return null;
	return decodeURIComponent(raw.slice(prefix.length));
}
