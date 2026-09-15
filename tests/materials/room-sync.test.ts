import { afterEach, describe, expect, it, vi } from "vitest";
import { createSalaSync } from "@/app/materials/_lib/room-sync";

describe("Sala sync — actor mutate", () => {
	it("success refreshes the actor and does not take the error path", async () => {
		const refresh = vi.fn();
		const onError = vi.fn();
		const sync = createSalaSync({ refresh, onError });

		await sync.mutate(() => Promise.resolve({ ok: true }));

		expect(refresh).toHaveBeenCalledOnce();
		expect(onError).not.toHaveBeenCalled();
	});

	it("error surfaces the message and does not refresh", async () => {
		const refresh = vi.fn();
		const onError = vi.fn();
		const sync = createSalaSync({ refresh, onError });

		await sync.mutate(() =>
			Promise.resolve({ ok: false, error: "El lobby no está abierto." }),
		);

		expect(onError).toHaveBeenCalledWith("El lobby no está abierto.");
		expect(refresh).not.toHaveBeenCalled();
	});

	it("a form mutation (Rating vote) refreshes the actor; FormData stays inside the module", async () => {
		const refresh = vi.fn();
		const onError = vi.fn();
		const sync = createSalaSync({ refresh, onError });
		const vote = async (
			_prev: { ok: true } | { ok: false; error: string },
			formData: FormData,
		) => {
			expect(formData.get("stars")).toBe("5");
			return { ok: true as const };
		};

		await sync.mutate({
			action: vote,
			fields: { session_id: "sess-1", stars: "5" },
		});

		expect(refresh).toHaveBeenCalledOnce();
		expect(onError).not.toHaveBeenCalled();
	});
});

describe("Sala sync — apply-latest", () => {
	it("observer keeps the newest Etapa when a stale snapshot arrives", () => {
		const sync = createSalaSync({ refresh: vi.fn(), onError: vi.fn() });
		type EtapaFrame = { asOf: number; roomStage: string };
		const presence: EtapaFrame = { asOf: 1_000, roomStage: "presence" };
		const draw: EtapaFrame = { asOf: 2_000, roomStage: "draw" };
		const stalePresence: EtapaFrame = { asOf: 1_500, roomStage: "presence" };

		const landed = sync.applyLatest(presence, draw);
		expect(landed.roomStage).toBe("draw");
		expect(sync.applyLatest(landed, stalePresence).roomStage).toBe("draw");
	});

	it("keeps Sesión finalizada when an older open snapshot arrives", () => {
		const sync = createSalaSync({ refresh: vi.fn(), onError: vi.fn() });
		const closed = { asOf: 2_000, status: "closed" };
		const staleOpen = { asOf: 1_000, status: "in_progress" };
		expect(sync.applyLatest(closed, staleOpen)).toBe(closed);
	});
});

describe("Sala sync — subscribe (observer)", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("Sorteo burst (draw + assignments) collapses to one observer refresh", () => {
		vi.useFakeTimers();
		const refresh = vi.fn();
		const sync = createSalaSync({ refresh, onError: vi.fn(), waitMs: 350 });
		const observer = sync.subscribe();

		observer.notify();
		observer.notify();
		observer.notify();
		expect(refresh).not.toHaveBeenCalled();

		vi.advanceTimersByTime(350);
		expect(refresh).toHaveBeenCalledOnce();
	});
});
