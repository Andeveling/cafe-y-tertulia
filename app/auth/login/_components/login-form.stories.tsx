import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { LoginForm } from "./login-form";

const meta = {
	component: LoginForm,
	tags: ["ai-generated"],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(
			canvas.getByRole("button", { name: /iniciar sesión/i }),
		);
		await expect(canvas.getByText(/el email no parece válido/i)).toBeVisible();
		await expect(canvas.getByText(/ingresá tu contraseña/i)).toBeVisible();
	},
};

export const PrefillEmail: Story = {
	args: { defaultEmail: "ana@ejemplo.com" },
};

export const CssCheck: Story = {
	play: async ({ canvas }) => {
		const button = canvas.getByRole("button", { name: /iniciar sesión/i });
		// Button default size uses h-8 (2rem) — fails if Tailwind / global CSS did not load.
		await expect(getComputedStyle(button).height).toBe("32px");
	},
};
