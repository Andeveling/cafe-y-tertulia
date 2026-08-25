import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type BoardSession, InicioBoard } from "./start-board";

const meta = {
	component: InicioBoard,
	tags: ["ai-generated"],
	decorators: [
		(Story) => (
			<div className="min-h-screen bg-background p-6">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof InicioBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

const materials = [
	{ id: "m1", title: "El Quijote" },
	{ id: "m2", title: "Cien años de soledad" },
];

const rosterMembers = [
	{ id: "u1", display_name: "Ana" },
	{ id: "u2", display_name: "Luis" },
];

export const Empty: Story = {
	args: {
		sessions: [],
		materials,
		displayName: "Ana",
		rosterMembers,
		userId: "u1",
	},
};

export const WithScheduled: Story = {
	args: {
		sessions: [
			{
				id: "s1",
				status: "preparation",
				scheduled_at: "2026-08-29T19:00:00Z",
				range: null,
				moderator_id: "u2",
				moderator_name: "Luis",
				material_title: "El Quijote",
			},
			{
				id: "s2",
				status: "preparation",
				scheduled_at: null,
				range: "Café del viernes",
				moderator_id: "u1",
				moderator_name: "Ana",
				material_title: null,
			},
		] satisfies BoardSession[],
		materials,
		displayName: "Ana",
		rosterMembers,
		userId: "u1",
	},
};

export const WithOpenSala: Story = {
	args: {
		sessions: [
			{
				id: "s3",
				status: "lobby",
				scheduled_at: null,
				range: null,
				moderator_id: "u1",
				moderator_name: "Ana",
				material_title: "El Quijote",
			},
			{
				id: "s4",
				status: "in_progress",
				scheduled_at: null,
				range: "Cap. 1–5",
				moderator_id: "u2",
				moderator_name: "Luis",
				material_title: null,
			},
			{
				id: "s5",
				status: "preparation",
				scheduled_at: "2026-08-30T18:00:00Z",
				range: null,
				moderator_id: "u3",
				moderator_name: "María",
				material_title: "Cien años de soledad",
			},
		] satisfies BoardSession[],
		materials,
		displayName: "Ana",
		rosterMembers,
		userId: "u1",
	},
};
