import { describe, expect, it } from "vitest";
import {
	LEFT_ROOM_WINDOW_MS,
	leftRoomMarker,
	leftRoomRecently,
	shouldSeatOnRoomLoad,
} from "@/app/materials/_lib/room-seat-gate";

const SESSION = "cd028908-3473-4fd8-a928-9844cc485770";
const NOW = 1_700_000_000_000;

describe("shouldSeatOnRoomLoad", () => {
	it("sienta a quien abre Preguntas y aún no está en la mesa", () => {
		expect(
			shouldSeatOnRoomLoad({
				status: "lobby",
				roomStage: "questions",
				seated: false,
				leftMarker: null,
				sessionId: SESSION,
				now: NOW,
			}),
		).toBe(true);
	});

	it("no vuelve a sentar a quien acaba de salir, aunque el refresh lo encuentre fuera", () => {
		expect(
			shouldSeatOnRoomLoad({
				status: "lobby",
				roomStage: "questions",
				seated: false,
				leftMarker: leftRoomMarker(SESSION, NOW - 1_000),
				sessionId: SESSION,
				now: NOW,
			}),
		).toBe(false);
	});

	it("sí lo sienta si el salir ya caducó y entra de nuevo", () => {
		expect(
			shouldSeatOnRoomLoad({
				status: "lobby",
				roomStage: "questions",
				seated: false,
				leftMarker: leftRoomMarker(SESSION, NOW - LEFT_ROOM_WINDOW_MS - 1),
				sessionId: SESSION,
				now: NOW,
			}),
		).toBe(true);
	});

	it("no trata el salir de otra sesión como el de esta", () => {
		expect(
			leftRoomRecently(leftRoomMarker("otra-sesion", NOW), SESSION, NOW),
		).toBe(false);
	});
});
