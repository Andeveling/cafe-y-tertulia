import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta = {
	title: "UI/Badge",
	component: Badge,
	tags: ["autodocs"],
	args: { children: "Badge" },
	argTypes: {
		variant: {
			control: "select",
			options: [
				"default",
				"secondary",
				"destructive",
				"outline",
				"ghost",
				"link",
			],
		},
	},
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Destructive: Story = {
	args: { variant: "destructive", children: "Error" },
};
export const Outline: Story = { args: { variant: "outline" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Link: Story = { args: { variant: "link", children: "Enlace" } };

export const All: Story = {
	render: () => (
		<div className="flex flex-wrap gap-2">
			{(
				[
					"default",
					"secondary",
					"destructive",
					"outline",
					"ghost",
					"link",
				] as const
			).map((variant) => (
				<Badge key={variant} variant={variant}>
					{variant}
				</Badge>
			))}
		</div>
	),
};
