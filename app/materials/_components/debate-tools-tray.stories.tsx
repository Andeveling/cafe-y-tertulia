import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { MinigameState, TriviaRoundSnapshot } from "../_lib/minigames";
import { DebateToolsTray } from "./debate-tools-tray";

const idleState: MinigameState = {
	liveRoundId: null,
	lastBoardRoundId: null,
	openTakeId: null,
	bank: [{ id: "tr-1", title: "Historia del café", itemCount: 3 }],
	takes: [],
	triviaRoundCount: 0,
	takeCount: 0,
};

const liveRound: TriviaRoundSnapshot = {
	roundId: "round-1",
	sessionId: "ses-1",
	triviaId: "tr-1",
	status: "live",
	questionIndex: 0,
	questionCount: 3,
	locked: false,
	prompt: "¿En qué año se fundó el primer café de Europa?",
	options: ["1650", "1720", "1804"],
	answeredCount: 1,
	myOption: null,
	optionCounts: null,
	scoreboard: [],
	winnerId: null,
	winnerName: null,
};

const boardRound: TriviaRoundSnapshot = {
	...liveRound,
	status: "board",
	questionIndex: 2,
	locked: true,
	prompt: null,
	options: null,
	answeredCount: 3,
	scoreboard: [
		{ memberId: "u-ana", displayName: "Ana", hits: 3 },
		{ memberId: "u-luis", displayName: "Luis", hits: 1 },
	],
	winnerId: "u-ana",
	winnerName: "Ana",
};

const openTake = {
	id: "take-1",
	prompt: "El filtro es superior al espresso",
	status: "open" as const,
	counts: { agree: 2, disagree: 1, neutral: 0 },
};

const meta = {
	component: DebateToolsTray,
	tags: ["ai-generated"],
	args: {
		sessionId: "ses-1",
		state: idleState,
		round: null,
		isModerator: false,
	},
} satisfies Meta<typeof DebateToolsTray>;

export default meta;
type Story = StoryObj<typeof meta>;

/** El Moderador ve los lanzadores dentro de los límites (1–2 rondas, ≤3 takes). */
export const ModeratorLaunchers: Story = {
	args: { isModerator: true },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("button", { name: /historia del café/i }),
		).toBeEnabled();
		await expect(
			canvas.getByRole("textbox", { name: /frase disparadora/i }),
		).toBeVisible();
	},
};

/** Un Participante no ve controles de lanzamiento. */
export const ParticipantIdle: Story = {
	play: async ({ canvas }) => {
		expect(
			canvas.queryByRole("button", { name: /historia del café/i }),
		).toBeNull();
		expect(
			canvas.queryByRole("textbox", { name: /frase disparadora/i }),
		).toBeNull();
	},
};

/** Los Participantes responden la trivia desde la Sala; sin controles de conducción. */
export const ParticipantAnswersLiveTrivia: Story = {
	args: { round: liveRound },
	play: async ({ canvas }) => {
		expect(canvas.getByText(liveRound.prompt!)).toBeVisible();
		await expect(canvas.getByRole("button", { name: /1650/ })).toBeEnabled();
		expect(
			canvas.queryByRole("button", { name: /cerrar pregunta/i }),
		).toBeNull();
	},
};

/** Pregunta cerrada: resultados agregados por opción, nunca respuestas individuales. */
export const LockedTriviaShowsAggregateCounts: Story = {
	args: {
		round: {
			...liveRound,
			locked: true,
			answeredCount: 3,
			optionCounts: [2, 1, 0],
			myOption: 0,
		},
	},
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("button", { name: /1650.*2/ }),
		).toBeDisabled();
	},
};

/** Marcador final agregado. */
export const ScoreboardBoard: Story = {
	args: { round: boardRound },
	play: async ({ canvas }) => {
		expect(canvas.getByText(/memoria de elefante/i)).toBeVisible();
		expect(canvas.getByText("Ana")).toBeVisible();
		expect(canvas.getByText("3")).toBeVisible();
	},
};

/** Límites agotados: sin lanzadores, solo resultados agregados de takes cerrados. */
export const LimitsExhaustedHidesLaunchers: Story = {
	args: {
		isModerator: true,
		state: {
			...idleState,
			bank: [],
			triviaRoundCount: 2,
			takeCount: 3,
			takes: [
				{
					...openTake,
					status: "closed",
					counts: { agree: 3, disagree: 0, neutral: 1 },
				},
			],
		},
	},
	play: async ({ canvas }) => {
		expect(
			canvas.queryByRole("textbox", { name: /frase disparadora/i }),
		).toBeNull();
		expect(
			canvas.queryByRole("button", { name: /historia del café/i }),
		).toBeNull();
		expect(canvas.getByText(/filtro es superior/i)).toBeVisible();
		expect(canvas.getByText(/👍 3/)).toBeVisible();
	},
};

/** Take abierto: voto con posiciones y conteos agregados. */
export const OpenTakeVoting: Story = {
	args: { state: { ...idleState, openTakeId: openTake.id, takes: [openTake] } },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("button", { name: /de acuerdo/i }),
		).toBeEnabled();
		expect(canvas.getByText(/👍 2/)).toBeVisible();
	},
};
