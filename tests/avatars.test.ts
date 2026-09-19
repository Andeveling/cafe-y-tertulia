import { describe, expect, it } from "vitest";
import { AVATARS, isValidAvatar, resolveAvatar } from "@/lib/avatars";

describe("avatar catalog", () => {
	it("expone los 20 SVG de public/avatars como src públicos", () => {
		expect(AVATARS).toHaveLength(20);
		for (const a of AVATARS) {
			expect(a.src).toMatch(/^\/avatars\/Avatar\d+\.svg$/);
			expect(a.label.length).toBeGreaterThan(0);
		}
		expect(new Set(AVATARS.map((a) => a.src)).size).toBe(20);
	});

	it("solo acepta src del catálogo", () => {
		expect(isValidAvatar("/avatars/Avatar01.svg")).toBe(true);
		expect(isValidAvatar("/avatars/Avatar02.svg")).toBe(false);
		expect(isValidAvatar("https://evil.test/a.svg")).toBe(false);
		expect(isValidAvatar(null)).toBe(false);
		expect(isValidAvatar(undefined)).toBe(false);
	});

	it("resuelve a src válido o null", () => {
		expect(resolveAvatar("/avatars/Avatar10.svg")).toBe(
			"/avatars/Avatar10.svg",
		);
		expect(resolveAvatar("/avatars/Avatar02.svg")).toBeNull();
		expect(resolveAvatar(null)).toBeNull();
	});
});
