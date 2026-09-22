/**
 * @vitest-environment jsdom
 *
 * Tests del contrato público de TurnSpotlight tras la consolidación a UNA
 * sola card ("En la palabra"). El test cubre las seams de comportamiento
 * observable:
 *
 *   - Hay exactamente una región "En la palabra" (la card única).
 *   - NO existe la región "Reloj del turno" (la sección eliminada).
 *   - Sin clockText la card no inventa un reloj. Quien habla lo ve porque
 *     StagePanel pasa el texto; el Moderador no tiene una segunda copia.
 *   - El voter (HeartPicker) se renderiza dentro de la card cuando se pasa.
 *   - El voter aparece DESPUÉS del blockquote (orden DOM).
 *   - El voter se omite cuando no se pasa.
 *   - En overtime la card marca "Tiempo extra"; en tiempo normal, nada.
 *
 * Tests en español para casar con el dominio del proyecto.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TurnSpotlight } from "@/app/materials/_components/turn-spotlight";

const baseProps = {
	speakerName: "Luis Restrepo",
	speakerAvatar: null,
	speakerVerb: "EXPONE",
	isComplement: false,
	authorName: "Ana Velilla",
	questionText: "¿Qué te movió a leer?",
	overtime: false,
};

afterEach(() => {
	cleanup();
});

describe("TurnSpotlight · card consolidada", () => {
	it("renderiza una única región 'En la palabra'", () => {
		render(<TurnSpotlight {...baseProps} />);
		expect(screen.getByRole("region", { name: "En la palabra" })).toBeTruthy();
		expect(
			screen.queryAllByRole("region", { name: "En la palabra" }).length,
		).toBe(1);
	});

	it("no renderiza la sección 'Reloj del turno'", () => {
		render(<TurnSpotlight {...baseProps} />);
		expect(
			screen.queryByRole("region", { name: "Reloj del turno" }),
		).toBeNull();
	});

	it("no inventa un reloj si no recibe clockText", () => {
		render(<TurnSpotlight {...baseProps} />);
		const section = screen.getByRole("region", { name: "En la palabra" });
		expect(section.textContent).not.toMatch(/\d+:\d{2}/);
	});

	it("marca 'Tiempo extra' solo cuando hay overtime", () => {
		const { rerender } = render(<TurnSpotlight {...baseProps} />);
		expect(screen.queryByText("Tiempo extra")).toBeNull();
		rerender(<TurnSpotlight {...baseProps} overtime />);
		expect(screen.getByText("Tiempo extra")).toBeTruthy();
	});

	it("ancla el voter dentro de la card, debajo del blockquote", () => {
		const voter = (
			<div
				data-testid="voter"
				role="radiogroup"
				aria-label="Califica de 1 a 5 corazones"
			>
				<span>♥</span>
			</div>
		);
		render(<TurnSpotlight {...baseProps} voter={voter} />);

		const section = screen.getByRole("region", { name: "En la palabra" });
		const blockquote = section.querySelector("blockquote");
		const voterEl = screen.getByTestId("voter");

		expect(blockquote).not.toBeNull();
		expect(section.contains(voterEl)).toBe(true);
		// Orden DOM: blockquote precede al voter.
		expect(
			blockquote!.compareDocumentPosition(voterEl) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("omite el voter cuando no se provee", () => {
		render(<TurnSpotlight {...baseProps} voter={undefined} />);
		expect(
			screen.queryByRole("radiogroup", { name: "Califica de 1 a 5 corazones" }),
		).toBeNull();
	});
});
