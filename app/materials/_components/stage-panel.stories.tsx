import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { RoomDebateSnapshot } from "../_lib/room-types";
import { StagePanel } from "./stage-panel";

const waiting: RoomDebateSnapshot = {
	mode: "waiting_reveal",
	nextAssigneeName: "Ana",
	nextAssigneeId: "u-ana",
	revealOrder: 1,
	remainingHidden: 3,
};

const active: Extract<RoomDebateSnapshot, { mode: "active" }> = {
	mode: "active",
	assignmentId: "asg-1",
	state: "exposition",
	questionText: "¿Qué te hizo pensar el capítulo 2?",
	assigneeName: "Ana",
	assigneeId: "u-ana",
	authorName: "Luis",
	revealOrder: 1,
	myNotes: null,
	phaseStartedAt: "2026-08-25T16:00:00.000Z",
	remainingHidden: 2,
};

const meta = {
	component: StagePanel,
	tags: ["ai-generated"],
	args: {
		debate: waiting,
		sessionId: "ses-1",
		userId: "u-marta",
		isModerator: true,
		authorId: "u-luis",
	},
} satisfies Meta<typeof StagePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WaitingRevealModerator: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Ana")).toBeVisible();
		await expect(
			canvas.getByRole("button", { name: /revelar pregunta/i }),
		).toBeEnabled();
	},
};

export const WaitingRevealMember: Story = {
	args: { userId: "u-ana", isModerator: false },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Te toca en un momento.")).toBeVisible();
	},
};

export const AudienceListens: Story = {
	args: { debate: active, isModerator: false, userId: "u-marta" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/escuchas a ana/i)).toBeVisible();
		await expect(
			canvas.getByText(/ana responde la pregunta de luis/i),
		).toBeVisible();
		await expect(canvas.queryByRole("button", { name: /\+1 min/i })).toBeNull();
	},
};

export const YouSpeak: Story = {
	args: { debate: active, userId: "u-ana", isModerator: false },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Te toca hablar.")).toBeVisible();
		await expect(
			canvas.getByText(/ana responde la pregunta de luis/i),
		).toBeVisible();
	},
};

export const ModeratorTimer: Story = {
	args: { debate: active, isModerator: true, userId: "u-marta" },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("button", { name: /\+1 min/i }),
		).toBeVisible();
		await expect(
			canvas.getByRole("button", { name: /siguiente/i }),
		).toBeVisible();
	},
};

export const Done: Story = {
	args: {
		debate: { mode: "done", remainingHidden: 0 },
	},
};
