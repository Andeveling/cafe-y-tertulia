import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { LobbySnapshot } from "../_lib/lobby";
import { LobbyPanel } from "./lobby-panel";

const baseLobby: LobbySnapshot = {
	sessionId: "ses-1",
	materialId: "mat-1",
	range: "Capítulos 1-3",
	status: "lobby",
	moderatorId: "u-marta",
	participants: [
		{ memberId: "u-marta", displayName: "Marta", optOut: false },
		{ memberId: "u-ana", displayName: "Ana", optOut: false },
	],
	drawDone: false,
	drawStatus: null,
	eligibleCount: 2,
	optOutCount: 0,
	unassignedNames: [],
	lobbyAssignments: [],
};

const meta = {
	component: LobbyPanel,
	tags: ["ai-generated"],
	args: {
		lobby: baseLobby,
		userId: "u-ana",
		isModerator: false,
	},
} satisfies Meta<typeof LobbyPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
	args: {
		lobby: {
			...baseLobby,
			participants: [],
			eligibleCount: 0,
		},
		userId: "u-ana",
		isModerator: false,
	},
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("button", { name: /estoy presente/i }),
		).toBeEnabled();
	},
};

export const MemberPresent: Story = {};

export const ModeratorReady: Story = {
	args: { userId: "u-marta", isModerator: true },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("button", { name: /ejecutar sorteo/i }),
		).toBeEnabled();
	},
};

export const DrawDone: Story = {
	args: {
		lobby: {
			...baseLobby,
			drawDone: true,
			unassignedNames: ["Pedro"],
			lobbyAssignments: [
				{
					assignmentId: "a1",
					questionId: "q1",
					authorName: "Ana",
					assigneeName: "Marta",
					state: "hidden",
					revealOrder: 1,
					questionText: null,
					questionVisible: false,
				},
				{
					assignmentId: "a2",
					questionId: "q2",
					authorName: "Marta",
					assigneeName: "Ana",
					state: "hidden",
					revealOrder: 2,
					questionText: null,
					questionVisible: false,
				},
			],
		},
	},
};

export const DrawRevealing: Story = {
	args: {
		lobby: {
			...baseLobby,
			drawDone: true,
			unassignedNames: [],
			lobbyAssignments: [
				{
					assignmentId: "a1",
					questionId: "q1",
					authorName: "Ana",
					assigneeName: "Marta",
					state: "exposition",
					revealOrder: 1,
					questionText: "¿Qué opinas del capítulo 2?",
					questionVisible: true,
				},
				{
					assignmentId: "a2",
					questionId: "q2",
					authorName: "Marta",
					assigneeName: "Ana",
					state: "hidden",
					revealOrder: 2,
					questionText: null,
					questionVisible: false,
				},
			],
		},
	},
};
