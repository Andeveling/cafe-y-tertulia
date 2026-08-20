import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./select";

const meta = {
	title: "UI/Select",
	component: Select,
	tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Select defaultValue="coffee">
			<SelectTrigger className="w-48" aria-label="Bebida">
				<SelectValue placeholder="Elige…" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="coffee">Café</SelectItem>
				<SelectItem value="tea">Té</SelectItem>
				<SelectItem value="water">Agua</SelectItem>
			</SelectContent>
		</Select>
	),
};
