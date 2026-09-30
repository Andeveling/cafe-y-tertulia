/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { GroupShelfView } from "@/app/g/[slug]/materials/_components/shelf-view";
import type { BibliotecaItem } from "@/app/materials/_lib/biblioteca-store";
import type { Postulacion } from "@/app/materials/_lib/postulacion-store";

const group = {
	groupName: "nojau",
	groupId: "g1",
	slug: "nojau",
	memberId: "me",
};

function material(
	overrides: Partial<Parameters<typeof GroupShelfView>[0]["materials"][number]>,
) {
	return {
		id: "m1",
		title: "Cien años de soledad",
		kind: "book" as const,
		author: "G. García Márquez",
		status: "in_progress" as const,
		image_url: null,
		sessions_count: 2,
		rating_avg: null,
		rating_count: 0,
		...overrides,
	};
}

const biblioteca: BibliotecaItem[] = [
	{
		id: "lib-1",
		owner_id: "me",
		title: "El Arte de Gastar Dinero",
		kind: "podcast",
		author: "Morgan Housel",
		image_url: null,
		source_url: null,
		motive: null,
		created_at: "2026-09-01",
	},
	{
		id: "lib-2",
		owner_id: "me",
		title: "La península de las casas vacías",
		kind: "book",
		author: "David Uclés",
		image_url: null,
		source_url: null,
		motive: null,
		created_at: "2026-09-02",
	},
];

const postulacion: Postulacion = {
	id: "nom-1",
	group_id: "g1",
	library_item_id: "lib-2",
	proposed_by: "me",
	kind: "book",
	title: "La península de las casas vacías",
	author: "David Uclés",
	image_url: null,
	source_url: null,
	status: "active",
	created_at: "2026-09-03",
};

afterEach(() => {
	cleanup();
});

describe("GroupShelfView (cards del catálogo)", () => {
	it("muestra cada material como card, incluido el terminado", () => {
		render(
			<GroupShelfView
				{...group}
				materials={[
					material({}),
					material({
						id: "done-1",
						title: "El arte de conversar",
						author: "Radio Ambulante",
						kind: "podcast",
						status: "finished",
						sessions_count: 1,
						rating_avg: 4,
						rating_count: 3,
					}),
				]}
				postulaciones={[]}
				biblioteca={[]}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: "La estantería de nojau" }),
		).toBeInTheDocument();
		expect(screen.getByText(/sorteo o pacto/i)).toBeInTheDocument();

		const catalog = screen.getByRole("region", { name: "Materiales" });
		expect(
			within(catalog).getByRole("link", { name: /cien años de soledad/i }),
		).toHaveAttribute("href", "/materials/m1");
		expect(
			within(catalog).getByRole("link", { name: /el arte de conversar/i }),
		).toHaveAttribute("href", "/materials/done-1");
		expect(within(catalog).getByText("Terminado")).toBeInTheDocument();
		expect(within(catalog).getByText("En curso")).toBeInTheDocument();
		expect(screen.queryByText(/proponer material/i)).not.toBeInTheDocument();
	});

	it("vacía dice la verdad y postular abre la biblioteca", async () => {
		const user = userEvent.setup();
		render(
			<GroupShelfView
				{...group}
				materials={[]}
				postulaciones={[]}
				biblioteca={[]}
			/>,
		);

		expect(
			screen.getByText(/todavía no hay materiales en este grupo/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/todavía no hay postulados en este grupo/i),
		).toBeInTheDocument();
		expect(screen.queryByText(/proponer material/i)).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /^postular$/i }));
		const dialog = await screen.findByRole("dialog", {
			name: /tu biblioteca/i,
		});
		expect(
			within(dialog).getByRole("link", { name: /tu biblioteca/i }),
		).toHaveAttribute("href", "/library");
	});

	it("lo que sigue lista postulados y la biblioteca se postula desde el modal", async () => {
		const user = userEvent.setup();
		render(
			<GroupShelfView
				{...group}
				materials={[]}
				postulaciones={[
					postulacion,
					{
						...postulacion,
						id: "nom-other",
						proposed_by: "other",
						title: "Ficciones",
						library_item_id: null,
					},
				]}
				biblioteca={biblioteca}
			/>,
		);

		const next = screen.getByRole("region", { name: "Lo que sigue" });
		expect(
			within(next).getAllByRole("button", { name: /retirar/i }),
		).toHaveLength(1);
		expect(
			within(next).getAllByRole("button", { name: /^postular$/i }),
		).toHaveLength(1);

		await user.click(within(next).getByRole("button", { name: /^postular$/i }));
		const dialog = await screen.findByRole("dialog", {
			name: /tu biblioteca/i,
		});
		const buttons = within(dialog).getAllByRole("button", {
			name: /^postular$/i,
		});
		expect(buttons).toHaveLength(2);
		const bookButton = buttons.find((button) =>
			button.closest("li")?.textContent?.includes("casas vacías"),
		);
		expect(bookButton).toBeDisabled();
		expect(
			within(dialog).getByText(/ya tienes una postulación activa/i),
		).toBeInTheDocument();
		const podcastButton = buttons.find((button) =>
			button.closest("li")?.textContent?.includes("Gastar Dinero"),
		);
		expect(podcastButton).toBeEnabled();
	});
});
