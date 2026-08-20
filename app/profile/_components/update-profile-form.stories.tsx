import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { UpdateProfileForm } from "./update-profile-form";

const meta = {
	component: UpdateProfileForm,
	tags: ["ai-generated"],
	args: { defaultDisplayName: "Ana" },
} satisfies Meta<typeof UpdateProfileForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByLabelText(/nombre/i)).toHaveValue("Ana");
	},
};

export const EmptyName: Story = {
	args: { defaultDisplayName: "" },
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: /guardar/i }));
		await expect(
			canvas.getByText(/el nombre no puede estar vacío/i),
		).toBeVisible();
	},
};
