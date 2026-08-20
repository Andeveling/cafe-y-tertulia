import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { SessionForm } from "./session-form";

const meta = {
	component: SessionForm,
	tags: ["ai-generated"],
	args: { materialId: "mat-1" },
} satisfies Meta<typeof SessionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(
			canvas.getByRole("button", { name: /nueva sesión/i }),
		);
		await expect(
			canvas.getByText(/el rango no puede estar vacío/i),
		).toBeVisible();
	},
};

export const WithRangeHint: Story = {};
