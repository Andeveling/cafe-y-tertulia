/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LibraryView } from "@/app/library/_components/library-view";
import type { BibliotecaItem } from "@/app/materials/_lib/biblioteca-store";

const items: BibliotecaItem[] = [
	{
		id: "b1",
		owner_id: "u1",
		title: "El nombre del viento",
		kind: "book",
		author: "Patrick Rothfuss",
		image_url: "https://ejemplo.com/portada.jpg",
		source_url: "https://ejemplo.com/fuente",
		motive: "Ideal para debate de personajes.",
		created_at: "2026-09-20",
	},
	{
		id: "b2",
		owner_id: "u1",
		title: "El hilo invisible",
		kind: "podcast",
		author: "Sonia Valiente",
		image_url: null,
		source_url: null,
		motive: null,
		created_at: "2026-09-22",
	},
];

afterEach(() => {
	cleanup();
});

describe("LibraryView (variante A: mesa lateral)", () => {
	it("muestra el form completo junto a la colección con conteo", () => {
		render(<LibraryView items={items} />);
		expect(
			screen.getByRole("heading", { name: /mi biblioteca/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/2 guardados/)).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: /guardar candidato/i }),
		).toBeInTheDocument();
		// El form ganador es el completo, no el stub del prototype.
		expect(
			screen.getByPlaceholderText("Ej.: El nombre del viento"),
		).toBeInTheDocument();
		expect(screen.getByText(/añade contexto/i)).toBeInTheDocument();
	});

	it("cada candidato muestra portada, motivo, fuente y acciones honestas", () => {
		render(<LibraryView items={items} />);
		const list = screen.getByRole("list");
		const rows = within(list).getAllByRole("listitem");
		expect(rows).toHaveLength(2);

		// Con imagen real se renderiza <img> decorativa; sin ella, la inicial.
		const coverImg = rows[0].querySelector("img");
		expect(coverImg).toHaveAttribute("src", "https://ejemplo.com/portada.jpg");
		expect(within(rows[1]).getByText("E")).toBeInTheDocument();

		expect(
			within(rows[0]).getByText(/debate de personajes/),
		).toBeInTheDocument();
		expect(
			within(rows[0]).getByRole("link", { name: /fuente/i }),
		).toHaveAttribute("href", "https://ejemplo.com/fuente");
		expect(
			within(rows[1]).queryByRole("link", { name: /fuente/i }),
		).not.toBeInTheDocument();

		// Postular lleva a /g (ahí se elige el grupo); Borrar borra.
		const postular = within(rows[0]).getByRole("button", {
			name: /postular/i,
		});
		expect(postular).toHaveAttribute("href", "/g");
		expect(
			within(rows[0]).getByRole("button", { name: /borrar/i }),
		).toBeInTheDocument();
	});

	it("vacía muestra el estado honesto y el form sigue visible", () => {
		render(<LibraryView items={[]} />);
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
		expect(screen.getByText(/aún no guardas candidatos/i)).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Ej.: El nombre del viento"),
		).toBeInTheDocument();
	});
});
