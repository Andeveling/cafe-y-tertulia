import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NativeSelect, NativeSelectOption } from "./native-select";

const meta = {
	title: "UI/NativeSelect",
	component: NativeSelect,
	tags: ["autodocs"],
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<NativeSelect defaultValue="lobby" aria-label="Fase">
			<NativeSelectOption value="prep">Preparación</NativeSelectOption>
			<NativeSelectOption value="lobby">Lobby</NativeSelectOption>
			<NativeSelectOption value="live">En curso</NativeSelectOption>
		</NativeSelect>
	),
};

export const Small: Story = {
	render: () => (
		<NativeSelect size="sm" defaultValue="a" aria-label="Opción">
			<NativeSelectOption value="a">A</NativeSelectOption>
			<NativeSelectOption value="b">B</NativeSelectOption>
		</NativeSelect>
	),
};
