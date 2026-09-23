/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupSettingsView } from "@/app/g/[slug]/_components/group-settings-view";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const group = {
	id: "g1",
	slug: "nojau",
	name: "Nojau",
	description: null as string | null,
	avatar: null as string | null,
	visibility: "private" as const,
};

const members = [
	{ id: "m1", display_name: "Ana", avatar: null, role: "admin" as const },
	{ id: "m2", display_name: "Luis", avatar: null, role: "member" as const },
];

describe("GroupSettingsView", () => {
	it("admin ve gestión: invitación, roles, expulsar y borrar", () => {
		render(
			<GroupSettingsView
				group={group}
				members={members}
				role="admin"
				userId="m1"
			/>,
		);
		expect(screen.getByText(/enlace de invitación/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /expulsar/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/zona de peligro/i)).toBeInTheDocument();
	});

	it("miembro no ve controles de gestión", () => {
		render(
			<GroupSettingsView
				group={group}
				members={members}
				role="member"
				userId="m2"
			/>,
		);
		expect(screen.queryByText(/enlace de invitación/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/zona de peligro/i)).not.toBeInTheDocument();
		expect(screen.getByText("Ana")).toBeInTheDocument();
	});
});
