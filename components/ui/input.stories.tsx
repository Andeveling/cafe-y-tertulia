import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";

const meta = {
	title: "UI/Input",
	component: Input,
	tags: ["autodocs"],
	args: {
		placeholder: "Escribe aquí…",
		className: "w-64",
	},
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = {
	args: { disabled: true, placeholder: "Deshabilitado" },
};
export const Invalid: Story = {
	args: { "aria-invalid": true, defaultValue: "dato inválido" },
};
export const Password: Story = {
	args: { type: "password", placeholder: "Contraseña" },
};
