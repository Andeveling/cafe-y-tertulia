import { describe, expect, it } from "vitest";
import {
	ROOM_PARTICIPANT_TABLES,
	roomSessionChangeFilter,
} from "@/app/materials/_hooks/use-room-realtime";
import {
	pickLatestRoomFrame,
	ROOM_LIVE_HEARTBEAT_MS,
	ROOM_OFFLINE_REFETCH_MS,
	roomChannelIsLive,
	roomRefreshIntervalMs,
	roomSurface,
	shouldApplyRefresh,
	shouldApplySnapshot,
	shouldRefetchOnChannelStatus,
	shouldRefetchOnVisibility,
} from "@/app/materials/_lib/room-sync";

describe("room realtime contract", () => {
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

describe("stale snapshot gate", () => {
	it("drops an older in-flight snapshot so a newer etapa is not overwritten", () => {
		expect(shouldApplySnapshot(2_000, 1_000)).toBe(false);
		expect(shouldApplySnapshot(2_000, 2_000)).toBe(false);
		expect(shouldApplySnapshot(2_000, 3_000)).toBe(true);
		expect(shouldApplyRefresh(5, 4)).toBe(false);
		expect(shouldApplyRefresh(5, 5)).toBe(true);
		expect(shouldApplyRefresh(5, 6)).toBe(true);
	});

	it("keeps Sesión finalizada when an older in-flight open snapshot arrives", () => {
		const closed = { asOf: 2_000, status: "closed" };
		const staleOpen = { asOf: 1_000, status: "in_progress" };
		const applied = pickLatestRoomFrame(closed, staleOpen);
		expect(applied).toBe(closed);
		expect(roomSurface(applied.status)).toBe("closed");
		const sameClock = { asOf: 2_000, status: "in_progress" };
		expect(pickLatestRoomFrame(closed, sameClock)).toBe(closed);
		expect(roomSurface("lobby")).toBe("open");
		expect(roomSurface("archived")).toBe("closed");
		expect(roomSurface("preparation")).toBe("inactive");
	});
});

describe("Etapa sync", () => {
	type EtapaFrame = { asOf: number; roomStage: string };

	it("moves every device to the newest Etapa, never back", () => {
		const presence: EtapaFrame = { asOf: 1_000, roomStage: "presence" };
		const draw: EtapaFrame = { asOf: 2_000, roomStage: "draw" };
		const debate: EtapaFrame = { asOf: 3_000, roomStage: "debate" };

		expect(pickLatestRoomFrame(presence, draw).roomStage).toBe("draw");
		const landed = pickLatestRoomFrame(draw, debate);
		expect(landed.roomStage).toBe("debate");

		const staleDraw: EtapaFrame = { asOf: 2_500, roomStage: "draw" };
		expect(pickLatestRoomFrame(landed, staleDraw).roomStage).toBe("debate");
	});

	it("keeps Cierre once reached, even if an open Etapa snapshot was in flight", () => {
		const cierre: EtapaFrame = { asOf: 4_000, roomStage: "cierre" };
		const staleDebate: EtapaFrame = { asOf: 3_500, roomStage: "debate" };

		expect(pickLatestRoomFrame(cierre, staleDebate).roomStage).toBe("cierre");
	});
});

describe("channel recovery", () => {
	it("refetches on SUBSCRIBED so a late join still catches the current Etapa", () => {
		expect(shouldRefetchOnChannelStatus("SUBSCRIBED", null)).toBe(true);
		expect(shouldRefetchOnChannelStatus("SUBSCRIBED", "JOINING")).toBe(true);
		expect(shouldRefetchOnChannelStatus("SUBSCRIBED", "CHANNEL_ERROR")).toBe(
			true,
		);
		expect(shouldRefetchOnChannelStatus("CHANNEL_ERROR", "SUBSCRIBED")).toBe(
			false,
		);
		expect(roomChannelIsLive("SUBSCRIBED")).toBe(true);
		expect(roomChannelIsLive("CHANNEL_ERROR")).toBe(false);
		expect(roomChannelIsLive("TIMED_OUT")).toBe(false);
	});

	it("refetches when the tab becomes visible again", () => {
		expect(shouldRefetchOnVisibility("visible")).toBe(true);
		expect(shouldRefetchOnVisibility("hidden")).toBe(false);
	});

	it("polls faster before join / while disconnected, and keeps a live heartbeat", () => {
		expect(roomRefreshIntervalMs(false, true)).toBe(ROOM_OFFLINE_REFETCH_MS);
		expect(roomRefreshIntervalMs(true, false)).toBe(ROOM_OFFLINE_REFETCH_MS);
		expect(roomRefreshIntervalMs(true, true)).toBe(ROOM_LIVE_HEARTBEAT_MS);
	});
});
