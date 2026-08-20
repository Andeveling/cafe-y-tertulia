import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { InviteForm } from "./invite-form";

const meta = {
	component: InviteForm,
	tags: ["ai-generated"],
} satisfies Meta<typeof InviteForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(
			canvas.getByRole("button", { name: /enviar invitación/i }),
		);
		await expect(canvas.getByText(/ese email no parece válido/i)).toBeVisible();
	},
};

export const ReadyToSend: Story = {};
