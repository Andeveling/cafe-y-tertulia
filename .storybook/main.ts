import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Next.js App Router via @storybook/nextjs-vite (recommended for Next ≥ 14.1).
 * @see https://storybook.js.org/docs/get-started/frameworks/nextjs-vite
 * (recipes/next is the older Webpack @storybook/nextjs path)
 */
const config: StorybookConfig = {
	stories: [
		"../components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../app/**/*.stories.@(js|jsx|mjs|ts|tsx)",
	],
	addons: [
		"@chromatic-com/storybook",
		"@storybook/addon-vitest",
		"@storybook/addon-a11y",
		"@storybook/addon-docs",
		"@storybook/addon-mcp",
		"msw-storybook-addon",
	],
	framework: {
		name: "@storybook/nextjs-vite",
		options: {
			// Load this project's next.config.ts (images, etc.)
			nextConfigPath: path.resolve(dirname, "../next.config.ts"),
		},
	},
	staticDirs: ["../public"],
	features: {
		// App uses RSC; opt-in Suspense wrapper for async server components
		experimentalRSC: true,
	},
	// tsconfig paths (@/*) are picked up automatically by the framework
};

export default config;
