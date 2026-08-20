import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
	title: "UI/Checkbox",
	component: Checkbox,
	tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Checkbox id="terms" defaultChecked />
			<Label htmlFor="terms">Acepto las reglas del club</Label>
		</div>
	),
};

export const Unchecked: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Checkbox id="news" />
			<Label htmlFor="news">Recibir avisos</Label>
		</div>
	),
};

export const Disabled: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Checkbox id="off" disabled />
			<Label htmlFor="off">Deshabilitado</Label>
		</div>
	),
};
