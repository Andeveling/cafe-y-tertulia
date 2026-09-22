/**
 * @vitest-environment jsdom
 *
 * Contrato del bloque de corazones: el label visible indica en todo momento
 * qué se puntúa (exposición vs pregunta) y es el nombre accesible
 * del radiogroup. Sin línea secundaria: solo label + corazones.
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeartPicker } from "@/app/materials/_components/heart-picker";
import { heartsSupportLabel } from "@/app/materials/_lib/hearts";

afterEach(() => {
	cleanup();
});

describe("heartsSupportLabel", () => {
	it("en exposición puntúa la exposición", () => {
		expect(
			heartsSupportLabel({
				phase: "exposition",
				assigneeName: "Luis Restrepo",
				authorName: "Ana Velilla",
			}),
		).toBe("Cómo estuvo la exposición de Luis Restrepo");
	});

	it("en complemento puntúa la pregunta", () => {
		expect(
			heartsSupportLabel({
				phase: "complement",
				assigneeName: "Luis Restrepo",
				authorName: "Ana Velilla",
			}),
		).toBe("Cómo estuvo la pregunta de Ana Velilla");
	});
});

describe("HeartPicker · label visible", () => {
	it("muestra el label y lo usa como nombre del radiogroup", () => {
		render(
			<HeartPicker
				value={null}
				label="Cómo estuvo la exposición de Luis Restrepo"
				onVote={() => {}}
			/>,
		);
		expect(
			screen.getByText("Cómo estuvo la exposición de Luis Restrepo"),
		).toBeTruthy();
		expect(
			screen.getByRole("radiogroup", {
				name: "Cómo estuvo la exposición de Luis Restrepo",
			}),
		).toBeTruthy();
	});

	it("no renderiza línea secundaria", () => {
		render(
			<HeartPicker
				value={null}
				label="Cómo estuvo la pregunta de Ana Velilla"
				onVote={() => {}}
			/>,
		);
		expect(screen.queryByText(/Califica de/)).toBeNull();
	});

	it("conserva los 5 radios y vota al pulsar", async () => {
		const onVote = vi.fn();
		const user = userEvent.setup();
		render(
			<HeartPicker
				value={null}
				label="Cómo estuvo la pregunta de Ana Velilla"
				onVote={onVote}
			/>,
		);
		const radio = screen.getByRole("radio", { name: "3 corazones" });
		await user.click(radio);
		expect(onVote).toHaveBeenCalledWith(3);
	});
});
