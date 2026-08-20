import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ResetPasswordForm } from "./reset-password-form";

const meta = {
	component: ResetPasswordForm,
	tags: ["ai-generated"],
} satisfies Meta<typeof ResetPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(
			canvas.getByRole("button", { name: /enviar enlace/i }),
		);
		await expect(canvas.getByText(/ingresá tu email/i)).toBeVisible();
	},
};

export const Filled: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(canvas.getByLabelText(/email/i), "ana@ejemplo.com");
		await expect(canvas.getByLabelText(/email/i)).toHaveValue(
			"ana@ejemplo.com",
		);
	},
};
