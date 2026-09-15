import { describe, expect, it } from "vitest";
import {
	formatClock,
	INTERVENTION_ORDER,
	interventionDisplay,
	interventionNextLabel,
	interventionProgressLine,
	nextInterventionState,
	overtimeSeconds,
	PHASE_LABELS,
	PHASE_SHORT_LABELS,
	phaseClockCaption,
	phaseClockLabel,
	remainingSeconds,
	SUGGESTED_SECONDS,
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
	it("recorre oculta → exposición → Complemento → completa", () => {
		expect([...INTERVENTION_ORDER]).toEqual([
			"hidden",
			"exposition",
			"complement",
			"complete",
		]);
		expect(nextInterventionState("hidden")).toBe("exposition");
		expect(nextInterventionState("exposition")).toBe("complement");
		expect(nextInterventionState("complement")).toBe("complete");
		expect(nextInterventionState("complete")).toBeNull();
	});

	it("etiqueta fases con los términos del dominio", () => {
		expect(PHASE_LABELS.exposition).toBe("Exposición");
		expect(PHASE_LABELS.complement).toBe("Complemento");
	});

	it("ofrece la acción de conducción de cada fase", () => {
		expect(interventionNextLabel("exposition")).toBe("Terminar exposición");
		expect(interventionNextLabel("complement")).toBe("Terminar complemento");
	});

	it("nombra corto cada fase para la línea única de progreso", () => {
		expect(PHASE_SHORT_LABELS.exposition).toBe("Exposición");
		expect(PHASE_SHORT_LABELS.complement).toBe("Complemento");
	});

	it("compone una sola línea de progreso", () => {
		expect(interventionProgressLine(1, 2)).toBe("Turno 1 de 2");
		expect(interventionProgressLine(1, 2, "exposition")).toBe(
			"Turno 1 de 2 · Exposición",
		);
	});

	it("etiqueta el reloj con fase y presupuesto", () => {
		expect(SUGGESTED_SECONDS.exposition).toBe(300);
		expect(phaseClockLabel("exposition")).toBe("Exposición · sugerido 5:00");
		expect(phaseClockLabel("complement")).toBe("Complemento · sugerido 2:00");
		expect(phaseClockCaption(45)).toBe("No corta, el moderador avanza");
		expect(phaseClockCaption(0)).toBe(
			"Tiempo sugerido cumplido · no corta, el moderador avanza cuando quiera",
		);
	});

	it("mide overtime sin negativizar el restante", () => {
		expect(overtimeSeconds(299, 300)).toBe(0);
		expect(overtimeSeconds(300, 300)).toBe(0);
		expect(overtimeSeconds(337, 300)).toBe(37);
		expect(remainingSeconds(T0, 300, T0 + 337_000)).toBe(0);
	});
});

const STARTED_AT = "2026-08-25T16:00:00.000Z";

describe("display de la Intervención", () => {
	it("Exposición cuenta atrás en m:ss", () => {
		const shown = interventionDisplay("exposition", STARTED_AT, T0 + 45_000);
		expect(shown.text).toBe("4:15");
		expect(shown.overtime).toBe(false);
		expect(shown.caption).toBe("No corta, el moderador avanza");
	});

	it("Exposición muestra overtime visible pasado el sugerido", () => {
		const shown = interventionDisplay("exposition", STARTED_AT, T0 + 337_000);
		expect(shown.text).toBe("+0:37");
		expect(shown.overtime).toBe(true);
		expect(shown.caption).toBe(
			"Pasado el sugerido · no corta, el moderador decide",
		);
	});

	it("Complemento cuenta arriba y no entra en overtime", () => {
		const shown = interventionDisplay("complement", STARTED_AT, T0 + 45_000);
		expect(shown.text).toBe("0:45");
		expect(shown.overtime).toBe(false);
		expect(shown.caption).toBe(
			"Tiempo transcurrido · el moderador cierra cuando quiera",
		);
	});

	it("Complemento pasado el sugerido sigue contando arriba, sin +", () => {
		const shown = interventionDisplay("complement", STARTED_AT, T0 + 150_000);
		expect(shown.text).toBe("2:30");
		expect(shown.overtime).toBe(false);
	});

	it("a 0:00 el reloj no corta: muestra 0:00 y al segundo siguiente overtime", () => {
		const atBudget = interventionDisplay(
			"exposition",
			STARTED_AT,
			T0 + 300_000,
		);
		expect(atBudget.text).toBe("0:00");
		expect(atBudget.overtime).toBe(false);

		const past = interventionDisplay("exposition", STARTED_AT, T0 + 301_000);
		expect(past.text).toBe("+0:01");
		expect(past.overtime).toBe(true);
	});

	it("Oculta y Completa no heredan el overtime de Exposición", () => {
		expect(
			interventionDisplay("hidden", STARTED_AT, T0 + 45_000).overtime,
		).toBe(false);
		expect(
			interventionDisplay("complete", STARTED_AT, T0 + 45_000).overtime,
		).toBe(false);
	});

	it("el porcentaje llena el sugerido, nunca más de 100", () => {
		expect(interventionDisplay("exposition", STARTED_AT, T0 + 45_000).pct).toBe(
			15,
		);
		expect(
			interventionDisplay("exposition", STARTED_AT, T0 + 337_000).pct,
		).toBe(100);
		expect(interventionDisplay("complement", STARTED_AT, T0 + 45_000).pct).toBe(
			38,
		);
		expect(
			interventionDisplay("complement", STARTED_AT, T0 + 150_000).pct,
		).toBe(100);
	});
});
