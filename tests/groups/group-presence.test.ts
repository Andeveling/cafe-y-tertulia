import { describe, expect, it } from "vitest";
import { presenceTopic } from "@/hooks/use-club-presence";

describe("presenceTopic", () => {
	it("sin grupo mantiene el canal histórico del club", () => {
		expect(presenceTopic(undefined)).toBe("club-roster");
	});

	it("dentro de un grupo el canal es solo de ese grupo", () => {
		expect(presenceTopic("g1")).toBe("group-g1-roster");
	});

	it("grupos distintos no comparten canal", () => {
		expect(presenceTopic("a")).not.toBe(presenceTopic("b"));
	});
});
