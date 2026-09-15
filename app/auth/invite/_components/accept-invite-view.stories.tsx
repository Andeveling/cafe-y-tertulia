import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
	AcceptInviteView,
	type AcceptInviteViewProps,
} from "./accept-invite-view";

const meta = {
	component: AcceptInviteView,
	tags: ["ai-generated"],
	parameters: { layout: "fullscreen" },
	decorators: [
		(Story) => (
			<div className="flex min-h-svh flex-1 flex-col items-center justify-center px-4">
				<div className="w-full max-w-sm">
					<Story />
				</div>
			</div>
		),
	],
} satisfies Meta<typeof AcceptInviteView>;

export default meta;
type Story = StoryObj<AcceptInviteViewProps>;

export const Listo: Story = {
	args: {
		state: "ready",
		email: "invitada@club.test",
		token: "demo-token",
	},
};

export const Caducado: Story = {
	args: {
		state: "expired",
	},
};

export const Invalido: Story = {
	args: {
		state: "invalid",
	},
};
