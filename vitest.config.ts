import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname =
	typeof __dirname !== "undefined"
		? __dirname
		: path.dirname(fileURLToPath(import.meta.url));

// Load .env.local (Next.js convention) so tests can reach local Supabase.
try {
	process.loadEnvFile(".env.local");
} catch {
	// No .env.local (CI): suite fails with a clear message.
}

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(dirname, "."),
			// Next.js virtual module; no-op outside the app runtime.
			"server-only": path.resolve(dirname, "tests/__mocks__/server-only.ts"),
		},
	},
	test: {
		include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
		// UI tests (.tsx) run in jsdom; logic tests (.ts) stay in node.
		// New .tsx tests no longer need the `@vitest-environment jsdom` pragma.
		environmentMatchGlobs: [["tests/**/*.test.tsx", "jsdom"]],
		setupFiles: ["./tests/setup.ts"],
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
});
