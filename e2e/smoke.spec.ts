import { expect, test } from "@playwright/test";

test("next serves a response", async ({ request }) => {
	// favicon is static — proves the server without hitting Supabase RSC pages
	const res = await request.get("/favicon.ico");
	expect(res.status()).toBeLessThan(500);
});
