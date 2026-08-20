import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta = {
	title: "UI/RadioGroup",
	component: RadioGroup,
	tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<RadioGroup defaultValue="mod" className="gap-3">
			<div className="flex items-center gap-2">
				<RadioGroupItem value="mod" id="r-mod" />
				<Label htmlFor="r-mod">Moderador</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="member" id="r-member" />
				<Label htmlFor="r-member">Miembro</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="guest" id="r-guest" />
				<Label htmlFor="r-guest">Invitado</Label>
			</div>
		</RadioGroup>
	),
};
