import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "./separator";

const meta = {
	title: "UI/Separator",
	component: Separator,
	tags: ["autodocs"],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
	render: () => (
		<div className="w-64 space-y-3">
			<p className="text-sm">Arriba</p>
			<Separator />
			<p className="text-sm">Abajo</p>
		</div>
	),
};

export const Vertical: Story = {
	render: () => (
		<div className="flex h-10 items-center gap-3">
			<span>A</span>
			<Separator orientation="vertical" />
			<span>B</span>
		</div>
	),
};
