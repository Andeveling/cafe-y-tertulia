import { describe, expect, it, vi } from "vitest";
import {
	applyRoomMutationResult,
	pickLatestRoomFrame,
	ROOM_OK_RESULT,
	type RoomActionResult,
	type RoomFormAction,
	roomFormData,
} from "@/app/materials/_lib/room-sync";

describe("applyRoomMutationResult", () => {
	it("on success refreshes the actor and does not take the error path", () => {
		const refresh = vi.fn();
		const onError = vi.fn();
		const onSuccess = vi.fn();

		applyRoomMutationResult({ ok: true }, { refresh, onError, onSuccess });

		expect(onSuccess).toHaveBeenCalledOnce();
		expect(refresh).toHaveBeenCalledOnce();
		expect(onError).not.toHaveBeenCalled();
	});

	it("on error surfaces the message and does not refresh", () => {
		const refresh = vi.fn();
		const onError = vi.fn();
		const onSuccess = vi.fn();

		applyRoomMutationResult(
			{ ok: false, error: "El lobby no está abierto." },
			{ refresh, onError, onSuccess },
		);

		expect(onError).toHaveBeenCalledOnce();
		expect(onError).toHaveBeenCalledWith("El lobby no está abierto.");
		expect(refresh).not.toHaveBeenCalled();
		expect(onSuccess).not.toHaveBeenCalled();
	});
});

describe("roomFormData", () => {
	it("carries the action fields, e.g. launching a take", () => {
		const formData = roomFormData({
			session_id: "sess-1",
			prompt: "¿El final te convenció?",
		});

		expect(formData.get("session_id")).toBe("sess-1");
		expect(formData.get("prompt")).toBe("¿El final te convenció?");
	});

	it("carries a vote position for a take", () => {
		const formData = roomFormData({
			take_id: "take-1",
			session_id: "sess-1",
			position: "agree",
		});

		expect(formData.get("position")).toBe("agree");
		expect(formData.get("take_id")).toBe("take-1");
	});
});

describe("single Sala mutation path", () => {
	function settle(
		result: RoomActionResult,
		handlers?: { onSuccess?: () => void },
	) {
		const refresh = vi.fn();
		const onError = vi.fn();
		const onSuccess = vi.fn(handlers?.onSuccess);
		applyRoomMutationResult(result, { refresh, onError, onSuccess });
		return { refresh, onError, onSuccess };
	}

	it("a direct mutation (e.g. saving a Pregunta) refreshes on success", async () => {
		const saveQuestion = (): Promise<RoomActionResult> =>
			Promise.resolve(ROOM_OK_RESULT);

		const { refresh, onError } = settle(await saveQuestion());

		expect(refresh).toHaveBeenCalledOnce();
		expect(onError).not.toHaveBeenCalled();
	});

	it("a form action (e.g. voting a take) resolves through the same path", async () => {
		const voteTake: RoomFormAction = (_prev, formData) => {
			expect(formData.get("position")).toBe("agree");
			return Promise.resolve({ ok: true });
		};

		const result = await voteTake(
			ROOM_OK_RESULT,
			roomFormData({
				take_id: "take-1",
				session_id: "sess-1",
				position: "agree",
			}),
		);
		const { refresh, onError, onSuccess } = settle(result);

		expect(onSuccess).toHaveBeenCalledOnce();
		expect(refresh).toHaveBeenCalledOnce();
		expect(onError).not.toHaveBeenCalled();
	});

	it("a failing form action surfaces the error without refreshing", async () => {
		const voteTake: RoomFormAction = () =>
			Promise.resolve({ ok: false, error: "El take ya está cerrado." });

		const result = await voteTake(
			ROOM_OK_RESULT,
			roomFormData({
				take_id: "take-1",
				session_id: "sess-1",
				position: "agree",
			}),
		);
		const { refresh, onError, onSuccess } = settle(result);

		expect(onError).toHaveBeenCalledWith("El take ya está cerrado.");
		expect(refresh).not.toHaveBeenCalled();
		expect(onSuccess).not.toHaveBeenCalled();
	});
});

describe("Sala round-trip through the seam", () => {
	it("advancing Etapa refreshes the actor and lands on the newest frame", async () => {
		const refresh = vi.fn();
		const onError = vi.fn();

		// El Moderador avanza de Presentes a Sorteo: éxito → refresh del actor.
		const advance: RoomFormAction = () => Promise.resolve({ ok: true });
		const result = await advance(
			ROOM_OK_RESULT,
			roomFormData({ session_id: "sess-1" }),
		);
		applyRoomMutationResult(result, { refresh, onError });
		expect(refresh).toHaveBeenCalledOnce();
		expect(onError).not.toHaveBeenCalled();

		// El realtime entrega la Etapa nueva; un snapshot viejo en vuelo no
		// devuelve la Sala a la Etapa anterior.
		type EtapaFrame = { asOf: number; roomStage: string };
		const presence: EtapaFrame = { asOf: 1_000, roomStage: "presence" };
		const draw: EtapaFrame = { asOf: 2_000, roomStage: "draw" };
		const stalePresence: EtapaFrame = { asOf: 1_500, roomStage: "presence" };

		const landed = pickLatestRoomFrame(presence, draw);
		expect(landed.roomStage).toBe("draw");

		const held = pickLatestRoomFrame(landed, stalePresence);
		expect(held.roomStage).toBe("draw");
	});
});
