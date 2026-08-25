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

const active: RoomDebateSnapshot = {
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
	},
} satisfies Meta<typeof StagePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WaitingRevealModerator: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Ana")).toBeVisible();
		await expect(
			canvas.getByRole("button", { name: /revelar/i }),
		).toBeEnabled();
	},
};

export const WaitingRevealMember: Story = {
	args: { userId: "u-ana", isModerator: false },
};

export const ActiveExposition: Story = {
	args: { debate: active },
};

export const AssigneeNotes: Story = {
	args: {
		debate: { ...active, state: "preparation", myNotes: "Llevar el epígrafe" },
		userId: "u-ana",
		isModerator: false,
	},
};

export const Done: Story = {
	args: {
		debate: {
			mode: "done",
			remainingHidden: 0,
		},
	},
};
