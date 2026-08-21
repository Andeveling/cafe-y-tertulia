import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { RatingDisplay } from "./rating-display";

const meta = {
	component: RatingDisplay,
	tags: ["autodocs"],
	args: { value: 4.2, count: 5 },
} satisfies Meta<typeof RatingDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fractional: Story = {
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("img", { name: /rating 4\.2 de 5, 5 votos/i }),
		).toBeVisible();
	},
};

export const SingleVote: Story = {
	args: { value: 5, count: 1 },
};

export const Large: Story = {
	args: { size: "lg" },
};

export const Empty: Story = {
	args: { value: null, count: 0 },
};
