import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	framework: {
		// name: '@storybook/react-webpack5', // Remove this
		name: "@storybook/nextjs", // Add this
		options: {},
	},
};

export default nextConfig;
