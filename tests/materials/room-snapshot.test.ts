import { describe, expect, it } from "vitest";
import { getRoomSnapshot, type RoomClient } from "@/app/materials/_lib/room";
import { shouldApplySnapshot } from "@/app/materials/_lib/room-sync";

const row = {
	session_id: "sess-1",
	material_id: null,
	range: "Cap. 1",
	status: "lobby",
	moderator_id: "mod-1",
	room_stage: "questions",
	participants: [],
	questions: [],
	readiness: { total: 0, ready: 0, all_ready: false },
	draw: { done: false, status: null, created_at: null },
	assignments: [],
	debate: null,
	cierre: null,
};

function rpcClient(payload: typeof row, during?: () => Promise<void>) {
	return {
		rpc: async () => {
			if (during) await during();
			return { data: payload, error: null };
		},
	} as unknown as RoomClient;
}

describe("getRoomSnapshot asOf", () => {
	it("stamps asOf at the start of the fetch so a slower older snapshot loses", async () => {
		let release!: () => void;
		const blocker = new Promise<void>((resolve) => {
			release = resolve;
		});

		const older = getRoomSnapshot(
			rpcClient({ ...row, room_stage: "questions" }, () => blocker),
			"sess-1",
		);

		await new Promise((r) => setTimeout(r, 20));

		const newer = await getRoomSnapshot(
			rpcClient({ ...row, room_stage: "presence" }),
			"sess-1",
		);

		release();
		const stale = await older;

		expect(newer).not.toBeNull();
		expect(stale).not.toBeNull();
		expect(newer!.asOf).toBeGreaterThan(stale!.asOf);
		expect(shouldApplySnapshot(newer!.asOf, stale!.asOf)).toBe(false);
		expect(stale!.roomStage).toBe("questions");
		expect(newer!.roomStage).toBe("presence");
	});
});
