import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { NewSessionDialog } from "./new-session-dialog";

const meta = {
	component: NewSessionDialog,
	tags: ["ai-generated"],
	args: { materialId: "mat-1" },
} satisfies Meta<typeof NewSessionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		await userEvent.click(
			canvas.getByRole("button", { name: /nueva sesión/i }),
		);
		await expect(canvas.getByLabelText(/rango cubierto/i)).toBeVisible();
	},
};
