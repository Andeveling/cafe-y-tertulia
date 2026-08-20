import type { Preview } from "@storybook/nextjs-vite";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import { cn } from "../lib/utils";
// Tailwind/PostCSS: handled by nextjs-vite from postcss.config.mjs
import "../app/globals.css";

// Mirror app/layout.tsx fonts so CSS variables match production
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});
const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		// Pure App Router project — stub next/navigation globally
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/",
				query: {},
			},
		},
		a11y: {
			test: "todo",
		},
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div
				lang="es"
				className={cn(
					"min-h-full antialiased font-sans",
					geistSans.variable,
					geistMono.variable,
					inter.variable,
				)}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<div className="bg-background text-foreground">
						<Story />
					</div>
				</ThemeProvider>
			</div>
		),
	],
};

export default preview;
