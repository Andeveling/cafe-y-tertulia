/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClubRoster } from "@/app/_components/club-roster";

const hookArgs: {
	userId: string | undefined;
	groupId: string | undefined;
}[] = [];

vi.mock("@/hooks/use-club-presence", () => ({
	useClubPresence: (
		userId: string | undefined,
		members: { id: string; display_name: string }[],
		opts?: { groupId?: string },
	) => {
		hookArgs.push({ userId, groupId: opts?.groupId });
		return members.map((m) => ({
			...m,
			avatar: null,
			estado: "desconectado" as const,
			ultimaVez: null,
			ultimaVezTexto: "hace mucho",
			enOtraSala: false,
			online: false,
		}));
	},
}));

afterEach(() => {
	cleanup();
	hookArgs.length = 0;
	vi.clearAllMocks();
});

const members = [
	{ id: "m1", display_name: "Ana", avatar: null },
	{ id: "m2", display_name: "Luis", avatar: null },
];

describe("ClubRoster por grupo (issue #77)", () => {
	it("usa el canal de presencia del grupo, no el global", () => {
		render(
			<ClubRoster sessions={[]} rosterMembers={members} userId="m1" groupId="g1" />,
		);
		expect(hookArgs).toEqual([{ userId: "m1", groupId: "g1" }]);
		expect(screen.getByText(/miembros · 0 en línea/i)).toBeInTheDocument();
	});

	it("cada miembro enlaza a su perfil global", () => {
		render(
			<ClubRoster sessions={[]} rosterMembers={members} userId="m1" groupId="g1" />,
		);
		expect(screen.getByRole("link", { name: /ana/i })).toHaveAttribute(
			"href",
			"/members/m1",
		);
		expect(screen.getByRole("link", { name: /luis/i })).toHaveAttribute(
			"href",
			"/members/m2",
		);
	});
});
