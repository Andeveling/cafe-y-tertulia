import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";

const meta = {
	title: "UI/Button",
	component: Button,
	tags: ["autodocs"],
	args: {
		children: "Continuar",
	},
	argTypes: {
		variant: {
			control: "select",
			options: [
				"default",
				"outline",
				"secondary",
				"ghost",
				"destructive",
				"link",
			],
		},
		size: {
			control: "select",
			options: [
				"default",
				"xs",
				"sm",
				"lg",
				"icon",
				"icon-xs",
				"icon-sm",
				"icon-lg",
			],
		},
		disabled: { control: "boolean" },
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outline: Story = {
	args: { variant: "outline" },
};

export const Secondary: Story = {
	args: { variant: "secondary" },
};

export const Destructive: Story = {
	args: { variant: "destructive", children: "Eliminar" },
};

export const Ghost: Story = {
	args: { variant: "ghost" },
};

export const Link: Story = {
	args: { variant: "link", children: "Ver más" },
};

export const Disabled: Story = {
	args: { disabled: true },
};

export const Sizes: Story = {
	render: () => (
		<div className="flex flex-wrap items-center gap-3">
			<Button size="xs">xs</Button>
			<Button size="sm">sm</Button>
			<Button size="default">default</Button>
			<Button size="lg">lg</Button>
		</div>
	),
};
