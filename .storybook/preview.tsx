import type { Preview } from "@storybook/nextjs-vite";
import { ThemeProvider } from "../components/theme-provider";
import "../app/globals.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		nextjs: {
			appDirectory: true,
		},
		a11y: {
			test: "todo",
		},
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<div className="bg-background text-foreground antialiased">
					<Story />
				</div>
			</ThemeProvider>
		),
	],
};

export default preview;
