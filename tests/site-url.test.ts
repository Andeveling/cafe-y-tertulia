import { afterEach, describe, expect, it } from "vitest";
import { siteUrl } from "@/lib/site-url";

const keys = [
	"NEXT_PUBLIC_SITE_URL",
	"VERCEL_PROJECT_PRODUCTION_URL",
	"VERCEL_URL",
] as const;

afterEach(() => {
	for (const key of keys) {
		delete process.env[key];
	}
});

describe("siteUrl", () => {
	it("usa NEXT_PUBLIC_SITE_URL si ya es absoluta", () => {
		process.env.NEXT_PUBLIC_SITE_URL = "https://cafe-y-tertulia.vercel.app/";
		expect(siteUrl()).toBe("https://cafe-y-tertulia.vercel.app");
	});

	it("antepone https si el env es solo el host", () => {
		process.env.NEXT_PUBLIC_SITE_URL = "cafe-y-tertulia.vercel.app";
		expect(siteUrl()).toBe("https://cafe-y-tertulia.vercel.app");
	});

	it("en local sin env cae a 127.0.0.1", () => {
		expect(siteUrl()).toBe("http://127.0.0.1:3000");
	});
});
