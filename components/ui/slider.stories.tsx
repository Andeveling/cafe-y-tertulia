import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Slider } from "./slider";

const meta = {
	title: "UI/Slider",
	component: Slider,
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div className="w-64">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { defaultValue: [40] },
};

export const Range: Story = {
	args: { defaultValue: [20, 80] },
};

export const Disabled: Story = {
	args: { defaultValue: [50], disabled: true },
};
