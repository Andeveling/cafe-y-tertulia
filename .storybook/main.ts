import type { StorybookConfig } from "@storybook/nextjs-vite";

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
	],
	framework: {
		name: "@storybook/nextjs", // Add this
		options: {},
	},
	staticDirs: ["../public"],
	features: {
		// experimental RSC stories when needed
		experimentalRSC: true,
	},
};

export default config;
