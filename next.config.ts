import type { NextConfig } from "next";

// Storybook's framework (nextjs-vite) is configured in .storybook/main.ts,
// not here — Next.js rejects any unknown keys (e.g. `framework`).
const nextConfig: NextConfig = {};

export default nextConfig;
