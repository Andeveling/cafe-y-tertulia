import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { toast } from "sonner";
import { Button } from "./button";
import { Toaster } from "./sonner";

const meta = {
	title: "UI/Sonner",
	component: Toaster,
	tags: ["autodocs"],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="flex flex-wrap gap-2">
			<Toaster />
			<Button size="sm" onClick={() => toast("Mensaje simple")}>
				Default
			</Button>
			<Button
				size="sm"
				variant="outline"
				onClick={() => toast.success("Guardado")}
			>
				Success
			</Button>
			<Button
				size="sm"
				variant="destructive"
				onClick={() => toast.error("Falló")}
			>
				Error
			</Button>
			<Button
				size="sm"
				variant="secondary"
				onClick={() => toast.info("Info del club")}
			>
				Info
			</Button>
		</div>
	),
};
