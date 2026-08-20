import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "./label";
import { Switch } from "./switch";

const meta = {
	title: "UI/Switch",
	component: Switch,
	tags: ["autodocs"],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Switch id="notify" defaultChecked />
			<Label htmlFor="notify">Notificaciones</Label>
		</div>
	),
};

export const Off: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Switch id="dark" />
			<Label htmlFor="dark">Modo oscuro</Label>
		</div>
	),
};

export const Disabled: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Switch id="x" disabled />
			<Label htmlFor="x">Deshabilitado</Label>
		</div>
	),
};
