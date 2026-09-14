import { describe, expect, it } from "vitest";
import {
	formatClock,
	INTERVENTION_ORDER,
	interventionNextLabel,
	interventionProgressLine,
	nextInterventionState,
	PHASE_LABELS,
	PHASE_SHORT_LABELS,
	phaseClockCaption,
	phaseClockLabel,
	remainingSeconds,
} from "@/app/materials/_lib/intervention";

const T0 = Date.parse("2026-08-25T16:00:00.000Z");

describe("reloj compartido del Escenario", () => {
	it("dos dispositivos con el mismo ancla ven el mismo restante", () => {
		expect(remainingSeconds(T0, 120, T0 + 45_000)).toBe(75);
		expect(remainingSeconds(T0, 120, T0 + 45_000)).toBe(75);
	});

	it("quien entra tarde ve el tiempo ya descontado, nunca negativo", () => {
		expect(remainingSeconds(T0, 120, T0 + 20_000)).toBe(100);
		expect(remainingSeconds(T0, 120, T0 + 400_000)).toBe(0);
		expect(remainingSeconds(T0, 120, T0 - 5_000)).toBe(120);
	});

	it("formatea m:ss", () => {
		expect(formatClock(75)).toBe("1:15");
		expect(formatClock(0)).toBe("0:00");
		expect(formatClock(600)).toBe("10:00");
	});
});

describe("ciclo de la Intervención", () => {
	it("recorre oculta → Momento de preparación → exposición → Complemento → completa", () => {
		expect([...INTERVENTION_ORDER]).toEqual([
			"hidden",
			"preparation",
			"exposition",
			"complement",
			"complete",
		]);
		expect(nextInterventionState("hidden")).toBe("preparation");
		expect(nextInterventionState("preparation")).toBe("exposition");
		expect(nextInterventionState("exposition")).toBe("complement");
		expect(nextInterventionState("complement")).toBe("complete");
		expect(nextInterventionState("complete")).toBeNull();
	});

	it("etiqueta fases con los términos del dominio", () => {
		expect(PHASE_LABELS.preparation).toBe("Momento de preparación");
		expect(PHASE_LABELS.complement).toBe("Complemento");
	});

	it("ofrece la acción de conducción de cada fase", () => {
		expect(interventionNextLabel("preparation")).toBe("Comenzar exposición");
		expect(interventionNextLabel("exposition")).toBe("Terminar exposición");
		expect(interventionNextLabel("complement")).toBe("Terminar complemento");
	});

	it("nombra corto cada fase para la línea única de progreso", () => {
		expect(PHASE_SHORT_LABELS.preparation).toBe("Preparación");
		expect(PHASE_SHORT_LABELS.exposition).toBe("Exposición");
		expect(PHASE_SHORT_LABELS.complement).toBe("Complemento");
	});

	it("compone una sola línea de progreso", () => {
		expect(interventionProgressLine(1, 2)).toBe("Turno 1 de 2");
		expect(interventionProgressLine(1, 2, "preparation")).toBe(
			"Turno 1 de 2 · Preparación",
		);
	});

	it("etiqueta el reloj con fase y presupuesto", () => {
		expect(phaseClockLabel("preparation")).toBe("Preparación · sugerido 2:00");
		expect(phaseClockLabel("exposition")).toBe("Exposición · sugerido 3:00");
		expect(phaseClockCaption(45)).toBe("No corta, el moderador avanza");
		expect(phaseClockCaption(0)).toBe(
			"Tiempo sugerido cumplido · no corta, el moderador avanza cuando quiera",
		);
	});
});
