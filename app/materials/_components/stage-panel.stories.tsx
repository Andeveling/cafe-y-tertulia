import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";
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

const expired: Extract<RoomDebateSnapshot, { mode: "active" }> = {
	...active,
	assignmentId: "asg-expired",
	phaseStartedAt: "2020-01-01T00:00:00.000Z",
};

const complementing: Extract<RoomDebateSnapshot, { mode: "active" }> = {
	...active,
	state: "complement",
	assignmentId: "asg-complement",
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
	args: {
		debate: active,
		isModerator: false,
		userId: "u-marta",
		members: [
			{ memberId: "u-ana", displayName: "Ana", role: "member", optOut: false },
			{
				memberId: "u-luis",
				displayName: "Luis",
				role: "member",
				optOut: false,
			},
			{
				memberId: "u-marta",
				displayName: "Marta",
				role: "member",
				optOut: false,
			},
			{
				memberId: "u-tito",
				displayName: "Tito",
				role: "member",
				optOut: false,
			},
		],
		nextAssigneeName: "Tito",
	},
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByText(/escuchas a ana/i)).toBeVisible(),
		);
		await expect(canvas.getByText("Turno 1 de 2")).toBeVisible();
		await expect(canvas.getByText("EXPONE")).toBeVisible();
		await expect(canvas.getByText("Pregunta de Luis")).toBeVisible();
		await expect(canvas.getByText("La mesa")).toBeVisible();
		await expect(canvas.getByText("Siguiente en exponer:")).toBeVisible();
		await expect(canvas.queryByRole("button", { name: /\+1 min/i })).toBeNull();
	},
};

export const YouSpeak: Story = {
	args: { debate: active, userId: "u-ana", isModerator: false },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByText("Te toca hablar.")).toBeVisible(),
		);
		await waitFor(() => expect(canvas.getByText("EXPONE")).toBeVisible());
		await expect(canvas.getByText("Pregunta de Luis")).toBeVisible();
		await expect(canvas.queryByText("Moderación")).toBeNull();
	},
};

export const ModeratorTimer: Story = {
	args: { debate: active, isModerator: true, userId: "u-marta" },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByText(/no corta, el moderador avanza/i)).toBeVisible(),
		);
		await expect(
			canvas.getByRole("button", { name: /\+1 min/i }),
		).toBeVisible();
		await expect(
			canvas.getByRole("button", { name: /terminar exposición/i }),
		).toBeVisible();
		await expect(canvas.getByText("Exposición · sugerido 5:00")).toBeVisible();
	},
};

export const ModeratorConfirmsAdvance: Story = {
	args: { debate: active, isModerator: true, userId: "u-marta" },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(
				canvas.getByRole("button", { name: /terminar exposición/i }),
			).toBeVisible(),
		);
		await userEvent.click(
			canvas.getByRole("button", { name: /terminar exposición/i }),
		);
		await waitFor(() =>
			expect(
				canvas.getByRole("button", { name: /^confirmar$/i }),
			).toBeVisible(),
		);
		await userEvent.click(canvas.getByRole("button", { name: /cancelar/i }));
		await expect(
			canvas.getByRole("button", { name: /terminar exposición/i }),
		).toBeVisible();
	},
};

export const ClockExpired: Story = {
	args: { debate: expired, isModerator: true, userId: "u-marta" },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(
				canvas.getByText(/pasado el sugerido · no corta, el moderador decide/i),
			).toBeVisible(),
		);
		await expect(canvas.queryByText("0:00")).toBeNull();
		await expect(
			canvas.getByRole("button", { name: /\+1 min/i }),
		).toBeVisible();
	},
};

export const ComplementCountsUp: Story = {
	args: { debate: complementing, isModerator: false, userId: "u-marta" },
	play: async ({ canvas }) => {
		await waitFor(() =>
			expect(canvas.getByText(/complementa\. tú escuchas/i)).toBeVisible(),
		);
		await waitFor(() => expect(canvas.getByText("COMPLEMENTA")).toBeVisible());
		await expect(canvas.getByText("Complemento · sugerido 2:00")).toBeVisible();
		await expect(canvas.queryByRole("button", { name: /\+1 min/i })).toBeNull();
	},
};

export const Done: Story = {
	args: {
		debate: { mode: "done", remainingHidden: 0 },
		next: "cierre",
		empty: false,
		warnings: [],
	},
};
