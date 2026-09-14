import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
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
	phaseStartedAt: new Date().toISOString(),
	remainingHidden: 2,
};

const preparing: Extract<RoomDebateSnapshot, { mode: "active" }> = {
	...active,
	state: "preparation",
	assignmentId: "asg-prep",
};

const expired: Extract<RoomDebateSnapshot, { mode: "active" }> = {
	...active,
	assignmentId: "asg-expired",
	phaseStartedAt: "2020-01-01T00:00:00.000Z",
};

const progress = { current: 1, total: 2 };

const meta = {
	component: StagePanel,
	tags: ["ai-generated"],
	args: {
		debate: waiting,
		sessionId: "ses-1",
		userId: "u-marta",
		isModerator: true,
		authorId: "u-luis",
		progress,
	},
} satisfies Meta<typeof StagePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WaitingRevealModerator: Story = {
	play: async ({ canvas }) => {
		await waitFor(() => expect(canvas.getByText("Ana")).toBeVisible());
		await expect(
			canvas.getByRole("button", { name: /revelar pregunta 1 para ana/i }),
		).toBeEnabled();
		await expect(
			canvas.getByText(/la verán todos\. no se puede des-revelar/i),
		).toBeVisible();
		await expect(canvas.queryByText("Moderación")).toBeNull();
	},
};

export const WaitingRevealMember: Story = {
	args: { userId: "u-ana", isModerator: false },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByText(/te toca en un momento/i)).toBeVisible(),
		);
	},
};

export const AudienceListens: Story = {
	args: { debate: active, isModerator: false, userId: "u-marta" },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByText(/escuchas a ana/i)).toBeVisible(),
		);
		await expect(canvas.getByText(/responde la pregunta de/i)).toBeVisible();
		await expect(canvas.queryByRole("button", { name: /\+1 min/i })).toBeNull();
		await expect(
			canvas.getByText("Turno 1 de 2 · Exposición"),
		).toBeVisible();
	},
};

export const YouSpeak: Story = {
	args: { debate: active, userId: "u-ana", isModerator: false },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByText("Te toca hablar.")).toBeVisible(),
		);
		await expect(canvas.getByText(/responde la pregunta de/i)).toBeVisible();
		await expect(canvas.queryByText("Moderación")).toBeNull();
	},
};

export const YouPrepare: Story = {
	args: { debate: preparing, userId: "u-ana", isModerator: false },
	play: async ({ canvas }) => {
		await waitFor(() => expect(canvas.getByText("Te toca.")).toBeVisible());
		await expect(
			canvas.getByLabelText(/tus notas de respuesta/i),
		).toBeVisible();
		await expect(
			canvas.getByText("Turno 1 de 2 · Preparación"),
		).toBeVisible();
		await expect(canvas.getByText("Preparación · sugerido 2:00")).toBeVisible();
	},
};

export const ModeratorTimer: Story = {
	args: { debate: active, isModerator: true, userId: "u-marta" },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByText(/no corta, el moderador avanza/i)).toBeVisible(),
		);
		await expect(canvas.queryByRole("button", { name: /\+1 min/i })).toBeNull();
		await expect(
			canvas.getByRole("button", { name: /terminar exposición/i }),
		).toBeVisible();
		await expect(canvas.getByText("Moderación")).toBeVisible();
		await expect(canvas.getByText("Exposición · sugerido 3:00")).toBeVisible();
	},
};

export const ClockExpired: Story = {
	args: { debate: expired, isModerator: true, userId: "u-marta" },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(
				canvas.getByText(
					/tiempo sugerido cumplido · no corta, el moderador avanza cuando quiera/i,
				),
			).toBeVisible(),
		);
		await expect(canvas.getByText("0:00")).toBeVisible();
	},
};

export const Done: Story = {
	args: {
		debate: { mode: "done", remainingHidden: 0 },
	},
};
