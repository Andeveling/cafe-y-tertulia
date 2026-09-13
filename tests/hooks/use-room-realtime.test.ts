import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	pickLatestRoomFrame,
	ROOM_LIVE_HEARTBEAT_MS,
	ROOM_OFFLINE_REFETCH_MS,
	ROOM_PARTICIPANT_TABLES,
	roomChannelIsLive,
	roomRefreshIntervalMs,
	roomSessionChangeFilter,
	roomSurface,
	shouldApplyRefresh,
	shouldApplySnapshot,
	shouldRefetchOnChannelStatus,
	shouldRefetchOnVisibility,
} from "@/app/materials/_hooks/use-room-realtime";

const root = path.resolve(import.meta.dirname, "../..");

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

	it("wires subscribe status and visibility refetch in the shipped hook", () => {
		const src = readFileSync(
			path.join(root, "app/materials/_hooks/use-room-realtime.ts"),
			"utf8",
		);
		const page = readFileSync(
			path.join(root, "app/materials/sessions/[id]/room/page.tsx"),
			"utf8",
		);
		const view = readFileSync(
			path.join(root, "app/materials/_components/room-session-view.tsx"),
			"utf8",
		);
		expect(src).toContain("shouldRefetchOnChannelStatus");
		expect(src).toContain("shouldRefetchOnVisibility");
		expect(src).toContain("roomRefreshIntervalMs");
		expect(src).toContain("visibilitychange");
		expect(src).toMatch(/subscribe\(\s*\(status\)/);
		expect(page).toContain("RoomSessionView");
		expect(page).not.toContain("RoomPanel");
		expect(page).not.toContain("RoomClosedView");
		expect(view).toContain("useLatestSnapshot");
		expect(view).toContain("RoomClosedView");
		expect(view).toContain("roomSurface");
	});
});
