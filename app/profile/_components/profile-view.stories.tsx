import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileView } from "./profile-view";

const meta = {
	component: ProfileView,
	tags: ["ai-generated"],
	parameters: { layout: "fullscreen" },
	args: {
		displayName: "Ana Tertuliana",
		status: "active",
		level: {
			level: 2,
			title: "Contertulio",
			sessionsAttended: 7,
			insigniasCount: 4,
			currentThreshold: 5,
			nextThreshold: 10,
			nextTitle: "Habitué",
			nextInsigniasRequired: 1,
		},
		badges: [
			{
				key: "primera-pregunta",
				emoji: "☕",
				name: "Primera pregunta",
				description: "Aportaste tu primera pregunta al club.",
				kind: "individual",
				earned: true,
				earnedDate: "2026-08-12T00:00:00.000Z",
			},
			{
				key: "debate-encendido",
				emoji: "🔥",
				name: "Debate encendido",
				description: "Participaste en un debate memorable.",
				kind: "individual",
				earned: true,
				earnedDate: "2026-09-02T00:00:00.000Z",
			},
			{
				key: "mente-abierta",
				emoji: "🌙",
				name: "Mente abierta",
				description: "Cambiaste de perspectiva en vivo.",
				kind: "individual",
				earned: false,
			},
			{
				key: "primer-libro",
				emoji: "📚",
				name: "Primer libro",
				description: "El club terminó su primer material.",
				kind: "collective",
				earned: true,
				earnedDate: "2026-07-30T00:00:00.000Z",
			},
			{
				key: "cincuenta-sesiones",
				emoji: "🏛️",
				name: "50 sesiones",
				description: "El club alcanzó 50 sesiones.",
				kind: "collective",
				earned: false,
			},
		],
		recognitions: [
			{
				category: "gran-debatiente",
				emoji: "🎙️",
				label: "Gran debatiente",
				seasonMonth: "agosto de 2026",
			},
		],
	},
} satisfies Meta<typeof ProfileView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NuevoMiembro: Story = {
	args: {
		displayName: "Invitado Nuevo",
		status: "invited",
		level: {
			level: 0,
			title: "",
			sessionsAttended: 0,
			insigniasCount: 0,
			currentThreshold: 0,
			nextThreshold: 1,
			nextTitle: "Novato",
			nextInsigniasRequired: 0,
		},
		badges: [],
		recognitions: [],
	},
};
