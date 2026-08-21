import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { RatingProgress } from "../_lib/rating";
import { RatingPanel } from "./rating-panel";

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
	component: RatingPanel,
	tags: ["ai-generated"],
	args: { progress: openVote },
} satisfies Meta<typeof RatingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenVoting: Story = {
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("button", { name: /cerrar votación/i }),
		).toBeEnabled();
		await expect(
			canvas.getByRole("button", { name: /calificar con 3 estrellas/i }),
		).toHaveAttribute("aria-pressed", "true");
		await expect(canvas.getByText(/1 de 4/i)).toBeVisible();
	},
};

export const ModeratorStart: Story = {
	args: {
		progress: {
			...openVote,
			ratingOpen: false,
			isParticipant: false,
			voted: 0,
			total: 4,
			myStars: null,
		},
	},
};

export const Frozen: Story = {
	args: {
		progress: {
			...openVote,
			ratingOpen: false,
			ratingAvg: 4.2,
			ratingCount: 5,
			sessionStatus: "closed",
		},
	},
};
