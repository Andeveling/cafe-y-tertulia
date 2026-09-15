import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InviteView } from "./invite-view";

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const pending = {
	id: "1",
	email: "pendiente@club.test",
	status: "pending" as const,
	created_at: new Date(now - day).toISOString(),
	expires_at: new Date(now + 6 * day).toISOString(),
	url: "http://127.0.0.1:3000/auth/invite?token=demo",
};

const meta = {
	component: InviteView,
	tags: ["ai-generated"],
	parameters: { layout: "fullscreen" },
	args: {
		invitations: [
			pending,
			{
				id: "2",
				email: "aceptada@club.test",
				status: "accepted",
				created_at: new Date(now - 2 * day).toISOString(),
				expires_at: new Date(now + 5 * day).toISOString(),
			},
			{
				id: "3",
				email: "revocada@club.test",
				status: "expired",
				created_at: new Date(now - day).toISOString(),
				expires_at: new Date(now + 6 * day).toISOString(),
			},
		],
	},
} satisfies Meta<typeof InviteView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EnlaceListo: Story = {
	args: {
		notice: "invited",
	},
};

export const ErrorPendiente: Story = {
	args: {
		error: "already_invited_pending",
	},
};
