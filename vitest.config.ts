import path from "node:path";
import { defineConfig } from "vitest/config";

// Load .env.local (Next.js convention) so tests can reach local Supabase.
try {
	process.loadEnvFile(".env.local");
} catch {
	// No .env.local (CI): tests will fail with a clear message from the suite.
}

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "."),
		},
	},
});
