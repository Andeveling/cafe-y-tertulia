/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupRoster } from "@/app/g/[slug]/_components/group-roster";
import { useClubPresence } from "@/hooks/use-club-presence";

vi.mock("@/lib/supabase/client", () => ({
	createClient: () => ({
		channel: () => ({
			presenceState: () => ({}),
			on() {
				return this;
			},
			subscribe() {
				return this;
			},
			track: async () => {},
			untrack: async () => {},
			unsubscribe: async () => {},
			joinedOnce: true,
		}),
		from: () => ({ update: () => ({ eq: async () => ({}) }) }),
	}),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

function Probe({
	members,
	groupId,
}: {
	members: { id: string; display_name: string; last_seen: string | null }[];
	groupId?: string;
}) {
	const roster = useClubPresence("m1", members, { groupId });
	return (
		<ul>
			{roster.map((m) => (
				<li key={m.id} data-testid={`online-${m.id}`}>
					{m.online ? "online" : "offline"}
				</li>
			))}
		</ul>
	);
}

describe("presencia por grupo no filtra actividad de otro grupo (issue #77)", () => {
	it("con groupId ignora last_seen global fresco sin payload en el canal", () => {
		const fresh = new Date().toISOString();
		render(
			<Probe
				groupId="gA"
				members={[{ id: "m2", display_name: "Luis", last_seen: fresh }]}
			/>,
		);
		expect(screen.getByTestId("online-m2")).toHaveTextContent("offline");
	});

	it("sin grupo mantiene el fallback histórico por last_seen", () => {
		const fresh = new Date().toISOString();
		render(
			<Probe
				members={[{ id: "m2", display_name: "Luis", last_seen: fresh }]}
			/>,
		);
		expect(screen.getByTestId("online-m2")).toHaveTextContent("online");
	});

	it("GroupRoster enlaza cada miembro a su perfil global", () => {
		render(
			<GroupRoster
				groupId="g1"
				userId="m1"
				members={[
					{
						id: "m1",
						display_name: "Ana",
						avatar: null,
						last_seen: null,
						role: "admin",
					},
					{
						id: "m2",
						display_name: "Luis",
						avatar: null,
						last_seen: null,
						role: "member",
					},
				]}
			/>,
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
