import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
	AvatarImage,
} from "./avatar";

const meta = {
	title: "UI/Avatar",
	component: Avatar,
	tags: ["autodocs"],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Avatar>
			<AvatarImage src="https://github.com/shadcn.png" alt="Usuario" />
			<AvatarFallback>CT</AvatarFallback>
		</Avatar>
	),
};

export const Fallback: Story = {
	render: () => (
		<Avatar>
			<AvatarFallback>AB</AvatarFallback>
		</Avatar>
	),
};

export const Sizes: Story = {
	render: () => (
		<div className="flex items-center gap-3">
			{(["sm", "default", "lg"] as const).map((size) => (
				<Avatar key={size} size={size}>
					<AvatarFallback>{size[0]?.toUpperCase()}</AvatarFallback>
				</Avatar>
			))}
		</div>
	),
};

export const Group: Story = {
	render: () => (
		<AvatarGroup>
			<Avatar>
				<AvatarFallback>A</AvatarFallback>
			</Avatar>
			<Avatar>
				<AvatarFallback>B</AvatarFallback>
			</Avatar>
			<Avatar>
				<AvatarFallback>C</AvatarFallback>
			</Avatar>
			<AvatarGroupCount>+3</AvatarGroupCount>
		</AvatarGroup>
	),
};
