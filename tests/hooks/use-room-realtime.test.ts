import { describe, expect, it } from "vitest";
import {
	ROOM_PARTICIPANT_TABLES,
	roomSessionChangeFilter,
} from "@/app/materials/_hooks/use-room-realtime";

describe("room realtime subscribe contract", () => {
	it("listens to sessions UPDATE so Presentes → Sorteo moves the stepper", () => {
		expect(roomSessionChangeFilter("sess-1")).toEqual({
			event: "UPDATE",
			schema: "public",
			table: "sessions",
			filter: "id=eq.sess-1",
		});
	});

	it("listens to draws and assignments so Ejecutar sorteo lands in realtime", () => {
		expect(ROOM_PARTICIPANT_TABLES).toContain("draws");
		expect(ROOM_PARTICIPANT_TABLES).toContain("assignments");
		expect(ROOM_PARTICIPANT_TABLES).toContain("session_participants");
		expect(ROOM_PARTICIPANT_TABLES).toContain("questions");
		expect(ROOM_PARTICIPANT_TABLES).toContain("votes");
	});

	it("listens to minigames so trivia and takes land in realtime during Debate", () => {
		expect(ROOM_PARTICIPANT_TABLES).toContain("trivia_rounds");
		expect(ROOM_PARTICIPANT_TABLES).toContain("takes");
	});
});
