import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { RatingProgress } from "../_lib/rating";
import { CierreStage } from "./cierre-stage";

const openVote: RatingProgress = {
	sessionId: "ses-1",
	materialId: "mat-1",
	ratingOpen: true,
	ratingAvg: null,
	ratingCount: 0,
	voted: 1,
	total: 4,
	myStars: 3,
	isModerator: true,
	isParticipant: true,
	sessionStatus: "in_progress",
};

const meta = {
	component: CierreStage,
	tags: ["ai-generated"],
	args: {
		sessionId: "ses-1",
		rating: openVote,
		cierre: { openTrivia: 0, openTakes: 0 },
		isModerator: true,
		hasMaterial: true,
	},
} satisfies Meta<typeof CierreStage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ModeradorTodoListo: Story = {
	args: {
		rating: { ...openVote, ratingOpen: false },
	},
	play: async ({ canvas }) => {
		await expect(
			canvas.getByText("Todo listo para cerrar la sesión."),
		).toBeVisible();
		await expect(
			canvas.getByRole("button", { name: /cerrar sesión/i }),
		).toBeVisible();
	},
};

export const ModeradorConPendientes: Story = {
	args: {
		cierre: { openTrivia: 1, openTakes: 2 },
		rating: { ...openVote, myStars: null, isParticipant: false },
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/trivia en curso \(1\)/i)).toBeVisible();
		await expect(canvas.getByText(/takes abiertos \(2\)/i)).toBeVisible();
	},
};

export const Participante: Story = {
	args: {
		isModerator: false,
	},
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("button", { name: /calificar con 3 estrellas/i }),
		).toHaveAttribute("aria-pressed", "true");
		await expect(
			canvas.queryByRole("button", { name: /cerrar sesión/i }),
		).toBeNull();
	},
};

export const SinMaterial: Story = {
	args: {
		rating: null,
		hasMaterial: false,
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Sin material")).toBeVisible();
		await expect(
			canvas.queryByRole("button", { name: /abrir votación/i }),
		).toBeNull();
		await expect(
			canvas.getByRole("button", { name: /^cerrar sesión$/i }),
		).toBeEnabled();
	},
};
