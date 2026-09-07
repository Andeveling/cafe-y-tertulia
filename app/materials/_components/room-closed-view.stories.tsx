import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { RoomClosedView } from "./room-closed-view";

const meta = {
	component: RoomClosedView,
	tags: ["ai-generated"],
	decorators: [
		(Story) => (
			<div className="bg-background min-h-screen">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof RoomClosedView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CerradaConRating: Story = {
	args: {
		materialId: "aaaaaaaa-0000-0000-0000-000000000001",
		status: "closed",
		range: "Epílogo",
		moderatorName: "Tertuliano Test",
		participantsCount: 4,
		questionsCount: 7,
		rating: { avg: 4.3, count: 4 },
	},
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("heading", { name: /sesión finalizada/i }),
		).toBeVisible();
		await expect(canvas.getByText(/4\.3/).textContent).toContain("4.3");
		await expect(
			canvas.getByRole("button", { name: /ir al material/i }),
		).toBeVisible();
		await expect(
			canvas.getByRole("button", { name: /volver al club/i }),
		).toBeVisible();
	},
};

export const CerradaSinRating: Story = {
	args: {
		...CerradaConRating.args,
		rating: null,
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/sin votos/i)).toBeVisible();
	},
};

export const Historico: Story = {
	args: {
		...CerradaConRating.args,
		status: "archived",
		rating: { avg: 3.8, count: 6 },
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/histórico/i)).toBeVisible();
	},
};

export const SinMaterial: Story = {
	args: {
		...CerradaConRating.args,
		materialId: null,
		range: "Sesión de Tertuliano Test",
	},
	play: async ({ canvas }) => {
		await expect(
			canvas.queryByRole("button", { name: /ir al material/i }),
		).toBeNull();
		await expect(
			canvas.getByRole("button", { name: /volver al club/i }),
		).toBeVisible();
	},
};

export const SinRango: Story = {
	args: {
		...CerradaConRating.args,
		range: null,
		moderatorName: "Tertuliano Test",
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/modera tertuliano/i)).toBeVisible();
	},
};
