import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { applyRoomMutationResult } from "@/app/materials/_hooks/use-room-mutation";

const root = path.resolve(import.meta.dirname, "../..");

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

describe("Sala mutation wiring", () => {
	it("routes Preguntas and Cerrar sesión through the shared helper", () => {
		const panel = readFileSync(
			path.join(root, "app/materials/_components/room-panel.tsx"),
			"utf8",
		);
		const cierre = readFileSync(
			path.join(root, "app/materials/_components/cierre-stage.tsx"),
			"utf8",
		);
		const hook = readFileSync(
			path.join(root, "app/materials/_hooks/use-room-mutation.ts"),
			"utf8",
		);

		expect(hook).toContain("applyRoomMutationResult");
		expect(panel).toMatch(/run\(\s*\(\) => saveQuestion/);
		expect(panel).toMatch(/run\(\s*\(\) => editQuestion/);
		expect(panel).toMatch(/run\(\s*\(\) => deleteQuestion/);
		expect(cierre).toContain("useRoomMutation");
		expect(cierre).toMatch(/run\(\s*\(\) => closeSession/);
	});
});
