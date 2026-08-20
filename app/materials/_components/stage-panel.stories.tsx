import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { StageSnapshot } from "../_lib/stage";
import { StagePanel } from "./stage-panel";

const waiting: StageSnapshot = {
	mode: "waiting_reveal",
	sessionId: "ses-1",
	materialId: "mat-1",
	range: "Capítulos 1-3",
	status: "in_progress",
	moderatorId: "u-marta",
	nextAssigneeName: "Ana",
	nextAssigneeId: "u-ana",
	revealOrder: 1,
	remainingHidden: 3,
};

const active: StageSnapshot = {
	mode: "active",
	sessionId: "ses-1",
	materialId: "mat-1",
	range: "Capítulos 1-3",
	status: "in_progress",
	moderatorId: "u-marta",
	assignmentId: "asg-1",
	state: "exposition",
	questionText: "¿Qué te hizo pensar el capítulo 2?",
	assigneeName: "Ana",
	assigneeId: "u-ana",
	authorName: "Luis",
	revealOrder: 1,
	myNotes: null,
	remainingHidden: 2,
};

const meta = {
	component: StagePanel,
	tags: ["ai-generated"],
	args: {
		stage: waiting,
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
	args: { stage: active },
};

export const AssigneeNotes: Story = {
	args: {
		stage: { ...active, state: "preparation", myNotes: "Llevar el epígrafe" },
		userId: "u-ana",
		isModerator: false,
	},
};

export const Done: Story = {
	args: {
		stage: {
			mode: "done",
			sessionId: "ses-1",
			materialId: "mat-1",
			range: "Capítulos 1-3",
			status: "in_progress",
			moderatorId: "u-marta",
			remainingHidden: 0,
		},
	},
};
