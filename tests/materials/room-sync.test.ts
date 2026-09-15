import { afterEach, describe, expect, it, vi } from "vitest";
import { createRefreshScheduler } from "@/app/materials/_lib/room-sync";

describe("createRefreshScheduler", () => {
	it("colapsa una ráfaga en un solo refresh (trailing edge)", () => {
		vi.useFakeTimers();
		try {
			const run = vi.fn();
			const scheduler = createRefreshScheduler(run, 350);
			scheduler.schedule();
			scheduler.schedule();
			scheduler.schedule();
			expect(run).not.toHaveBeenCalled();
			vi.advanceTimersByTime(350);
			expect(run).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
		}
	});

	it("reprograma el temporizador si llega otro evento antes del disparo", () => {
		vi.useFakeTimers();
		try {
			const run = vi.fn();
			const scheduler = createRefreshScheduler(run, 350);
			scheduler.schedule();
			vi.advanceTimersByTime(300);
			scheduler.schedule();
			vi.advanceTimersByTime(300);
			expect(run).not.toHaveBeenCalled();
			vi.advanceTimersByTime(50);
			expect(run).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
		}
	});

	it("cancel evita el refresh pendiente", () => {
		vi.useFakeTimers();
		try {
			const run = vi.fn();
			const scheduler = createRefreshScheduler(run, 350);
			scheduler.schedule();
			scheduler.cancel();
			vi.advanceTimersByTime(1000);
			expect(run).not.toHaveBeenCalled();
		} finally {
			vi.useRealTimers();
		}
	});
});
