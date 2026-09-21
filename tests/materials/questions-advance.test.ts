import { describe, expect, it } from "vitest";
import { questionsAdvance } from "@/app/materials/_lib/questions-advance";

const member = (memberId: string, optOut = false) => ({
	memberId,
	role: "member" as const,
	optOut,
});

describe("questionsAdvance", () => {
	it("no dice que todos tienen pregunta si la mesa está vacía", () => {
		const gate = questionsAdvance({
			participants: [],
			questionAuthorIds: [],
		});

		expect(gate.canAdvance).toBe(false);
		expect(gate.headline).not.toBe("Todos tienen pregunta.");
		expect(gate.readyCount).toBe(0);
	});

	it("no deja avanzar con participantes pero sin preguntas", () => {
		const gate = questionsAdvance({
			participants: [member("a"), member("b")],
			questionAuthorIds: [],
		});

		expect(gate.canAdvance).toBe(false);
		expect(gate.readyCount).toBe(0);
		expect(gate.missingCount).toBe(2);
		expect(gate.headline).not.toBe("Todos tienen pregunta.");
	});

	it("exige al menos dos personas distintas, no dos preguntas del mismo autor", () => {
		const gate = questionsAdvance({
			participants: [member("a")],
			questionAuthorIds: ["a", "a"],
		});

		expect(gate.canAdvance).toBe(false);
		expect(gate.readyCount).toBe(1);
	});

	it("abre el avance cuando hay al menos dos miembros con pregunta", () => {
		const ready = questionsAdvance({
			participants: [member("a"), member("b")],
			questionAuthorIds: ["a", "b"],
		});

		expect(ready.canAdvance).toBe(true);
		expect(ready.missingCount).toBe(0);
		expect(ready.headline).toBe("Todos tienen pregunta.");

		const withExtra = questionsAdvance({
			participants: [member("a"), member("b"), member("c")],
			questionAuthorIds: ["a", "b"],
		});

		expect(withExtra.canAdvance).toBe(true);
		expect(withExtra.missingCount).toBe(1);
		expect(withExtra.headline).toContain("Faltan 1");
	});

	it("no cuenta espectadores ni quien se sacó del sorteo", () => {
		const gate = questionsAdvance({
			participants: [
				member("a"),
				member("b", true),
				{ memberId: "c", role: "spectator", optOut: false },
			],
			questionAuthorIds: ["a", "b", "c"],
		});

		expect(gate.readyCount).toBe(1);
		expect(gate.canAdvance).toBe(false);
	});
});
