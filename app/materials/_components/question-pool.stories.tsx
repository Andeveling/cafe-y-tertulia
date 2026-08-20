import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { QuestionWithAuthor } from "../_lib/questions";
import { QuestionPool } from "./question-pool";

const questions: QuestionWithAuthor[] = [
	{
		id: "q1",
		sessionId: "ses-1",
		materialId: "mat-1",
		authorId: "u-ana",
		text: "¿Qué te hizo pensar el capítulo 2?",
		outsideDraw: false,
		createdAt: "2024-04-01T12:00:00Z",
		authorName: "Ana",
	},
	{
		id: "q2",
		sessionId: "ses-1",
		materialId: "mat-1",
		authorId: "u-luis",
		text: "¿El autor se contradice en el epílogo?",
		outsideDraw: true,
		createdAt: "2024-04-01T12:05:00Z",
		authorName: "Luis",
	},
];

const meta = {
	component: QuestionPool,
	tags: ["ai-generated"],
	args: {
		questions,
		sessionId: "ses-1",
		sessionRange: "Capítulos 1-3",
		materialId: "mat-1",
		currentUserId: "u-ana",
		isModerator: false,
	},
} satisfies Meta<typeof QuestionPool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
	args: { questions: [] },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByText(/aún no hay preguntas para esta sesión/i),
		).toBeVisible();
	},
};

export const MemberView: Story = {};

export const ModeratorView: Story = {
	args: { isModerator: true },
	play: async ({ canvas }) => {
		const switches = canvas.getAllByRole("switch", {
			name: /fuera de sorteo/i,
		});
		await expect(switches).toHaveLength(2);
		await expect(switches[1]).toBeChecked();
	},
};
