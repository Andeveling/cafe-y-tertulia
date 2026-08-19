import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./", import.meta.url)),
			// server-only es una guardia de Next que lanza fuera del contexto
			// servidor; en tests de node no aplica.
			"server-only": fileURLToPath(
				new URL("./test/stubs/server-only.ts", import.meta.url),
			),
		},
	},
	test: {
		environment: "node",
		include: ["**/*.test.{ts,tsx}"],
		exclude: ["node_modules", ".next"],
		setupFiles: ["./test/setup.ts"],
		// La shell exporta NODE_ENV=production; react resuelve entonces el build
		// production que no incluye React.act. Forzamos test para los tests.
		env: { NODE_ENV: "test" },
		// testing-library auto-limpia con afterEach global.
		globals: true,
	},
});
