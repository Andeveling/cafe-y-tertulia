import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "./skeleton";

const meta = {
	title: "UI/Skeleton",
	component: Skeleton,
	tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="flex w-64 flex-col gap-3">
			<div className="flex items-center gap-3">
				<Skeleton className="size-10 rounded-full" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-3 w-3/4" />
					<Skeleton className="h-3 w-1/2" />
				</div>
			</div>
			<Skeleton className="h-24 w-full" />
		</div>
	),
};
