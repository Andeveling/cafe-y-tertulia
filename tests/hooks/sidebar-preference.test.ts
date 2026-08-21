import { describe, expect, it } from "vitest";
import { sidebarOpenFromCookie } from "@/lib/sidebar-preference";

describe("sidebarOpenFromCookie", () => {
	it("defaults to open when the user has no stored preference", () => {
		expect(sidebarOpenFromCookie(undefined)).toBe(true);
	});

	it("restores a collapsed sidebar", () => {
		expect(sidebarOpenFromCookie("false")).toBe(false);
	});

	it("restores an expanded sidebar", () => {
		expect(sidebarOpenFromCookie("true")).toBe(true);
	});
});
