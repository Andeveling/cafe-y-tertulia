import type { NextConfig } from "next";

// Storybook's framework (nextjs-vite) is configured in .storybook/main.ts,
// not here — Next.js rejects any unknown keys (e.g. `framework`).
const nextConfig: NextConfig = {
	allowedDevOrigins: [
		"127.0.0.1",
		"localhost",
		"127.0.0.1:3000",
		"localhost:3000",
	],
};

export default nextConfig;
