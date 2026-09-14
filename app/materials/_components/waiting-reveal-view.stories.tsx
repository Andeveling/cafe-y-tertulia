import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import { WaitingRevealView } from "./waiting-reveal-view";

const meta = {
	component: WaitingRevealView,
	args: {
		nextAssigneeName: "Ana",
		progressText: "Turno 1 de 2",
		revealLabel: "Revelar pregunta 1 para Ana",
		pending: false,
	},
} satisfies Meta<typeof WaitingRevealView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Moderador al que le toca: una sola acción primaria con consecuencia. */
export const ModeratorNext: Story = {
	args: { youNext: true, isModerator: true, onReveal: () => {} },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() =>
			expect(canvas.getByText("Turno 1 de 2")).toBeVisible(),
		);
		await expect(
			canvas.getByText(/te toca en un momento/i),
		).toBeVisible();
		await expect(
			canvas.getByRole("button", { name: /revelar pregunta 1 para ana/i }),
		).toBeEnabled();
		await expect(
			canvas.getByText(/la verán todos\. no se puede des-revelar/i),
		).toBeVisible();
		expect(canvas.queryByText("Moderación")).toBeNull();
		expect(canvas.queryByText("Solo tú ves esto.")).toBeNull();
	},
};

/** Moderador cuando le toca a otro: sin jerga, sin etiqueta Moderación. */
export const ModeratorOther: Story = {
	args: {
		youNext: false,
		isModerator: true,
		nextAssigneeName: "Luis",
		revealLabel: "Revelar pregunta 1 para Luis",
		onReveal: () => {},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() =>
			expect(
				canvas.getByText(/la pregunta sigue oculta hasta que la reveles/i),
			).toBeVisible(),
		);
		await expect(
			canvas.getByRole("button", { name: /revelar pregunta 1 para luis/i }),
		).toBeEnabled();
	},
};

/** Participante que espera: sabe quién sigue y que el moderador revela. */
export const ParticipantWaits: Story = {
	args: { youNext: false, isModerator: false },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() =>
			expect(
				canvas.getByText(/espera a que el moderador la revele/i),
			).toBeVisible(),
		);
		expect(
			canvas.queryByRole("button", { name: /revelar pregunta/i }),
		).toBeNull();
	},
};

/** Participante al que le toca: lo sabe sin que le expliquen la UI. */
export const ParticipantNext: Story = {
	args: { youNext: true, isModerator: false },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() =>
			expect(canvas.getByText(/te toca en un momento/i)).toBeVisible(),
		);
		expect(
			canvas.queryByRole("button", { name: /revelar pregunta/i }),
		).toBeNull();
	},
};
