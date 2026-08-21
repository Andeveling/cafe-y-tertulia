import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StageBar } from "./stage-bar";

const meta = {
	component: StageBar,
	tags: ["ai-generated"],
	args: { current: "questions" },
} satisfies Meta<typeof StageBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Questions: Story = {};

export const Presence: Story = {
	args: { current: "presence" },
};

export const Draw: Story = {
	args: { current: "draw" },
};
