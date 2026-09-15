import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InvitationList } from "./invitation-list";

const now = Date.now();
const hour = 60 * 60 * 1000;

const meta = {
	component: InvitationList,
	tags: ["ai-generated"],
} satisfies Meta<typeof InvitationList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mixed: Story = {
	args: {
		invitations: [
			{
				id: "1",
				email: "pendiente@club.test",
				status: "pending",
				created_at: new Date(now - 6 * hour).toISOString(),
				expires_at: new Date(now + 18 * hour).toISOString(),
				url: "http://127.0.0.1:3000/auth/invite?token=demo",
			},
			{
				id: "2",
				email: "aceptada@club.test",
				status: "accepted",
				created_at: new Date(now - 20 * hour).toISOString(),
				expires_at: new Date(now + 4 * hour).toISOString(),
			},
			{
				id: "3",
				email: "revocada@club.test",
				status: "expired",
				created_at: new Date(now - 2 * hour).toISOString(),
				expires_at: new Date(now + 22 * hour).toISOString(),
			},
		],
	},
};
