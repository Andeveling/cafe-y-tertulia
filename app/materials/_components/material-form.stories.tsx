import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { MaterialForm } from "./material-form";

const meta = {
	component: MaterialForm,
	tags: ["ai-generated"],
} satisfies Meta<typeof MaterialForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(
			canvas.getByRole("button", { name: /proponer material/i }),
		);
		await expect(canvas.getByText(/el título es obligatorio/i)).toBeVisible();
		await expect(canvas.getByText(/el autor es obligatorio/i)).toBeVisible();
	},
};

export const ReadyToSubmit: Story = {};
