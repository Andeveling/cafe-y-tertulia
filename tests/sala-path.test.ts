import { describe, expect, it } from "vitest";
import { isAuthPath, isSalaPath } from "@/lib/sala-path";

describe("isSalaPath", () => {
	it("reconoce la Sala y nada más", () => {
		expect(isSalaPath("/materials/sessions/abc/room")).toBe(true);
		expect(isSalaPath("/materials/sessions/abc/room/")).toBe(true);
		expect(isSalaPath("/materials/sessions/abc")).toBe(false);
		expect(isSalaPath("/materials/sessions/abc/lobby")).toBe(false);
		expect(isSalaPath("/")).toBe(false);
		expect(isSalaPath(null)).toBe(false);
	});
});

describe("isAuthPath", () => {
	it("cubre entrar y no el club", () => {
		expect(isAuthPath("/auth")).toBe(true);
		expect(isAuthPath("/auth/login")).toBe(true);
		expect(isAuthPath("/auth/invite")).toBe(true);
		expect(isAuthPath("/invite")).toBe(false);
		expect(isAuthPath("/")).toBe(false);
		expect(isAuthPath("/materials")).toBe(false);
		expect(isAuthPath(null)).toBe(false);
	});
});
