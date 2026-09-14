import { describe, expect, it } from "vitest";
import {
	type BoardSession,
	othersHeading,
	sessionCta,
	sessionHref,
	sessionOpensSala,
} from "@/app/_components/board-helpers";

const prep: BoardSession = {
	id: "cap-10",
	status: "preparation",
	scheduled_at: "2026-09-14T00:00:00Z",
	range: "Capitulo 10",
	moderator_id: "u1",
	moderator_name: "Andrés",
	material_id: "m-hyper",
	material_title: "Hyperfocus",
};

const live: BoardSession = {
	...prep,
	id: "cap-8",
	status: "in_progress",
	range: "Capitulo 8 y 9",
};

describe("sessionHref", () => {
	it("preparation va a la Sala, no al Histórico", () => {
		expect(sessionHref(prep)).toBe(
			"/materials/sessions/cap-10/room",
		);
	});

	it("lobby e in_progress también van a la Sala", () => {
		expect(sessionHref({ ...prep, status: "lobby" })).toBe(
			"/materials/sessions/cap-10/room",
		);
		expect(sessionHref(live)).toBe("/materials/sessions/cap-8/room");
	});
});

describe("sessionCta", () => {
	it("preparation ofrece Abrir sala, no Ver", () => {
		expect(sessionCta(prep.status, "row")).toBe("Abrir sala");
		expect(sessionCta(prep.status, "hero")).toBe("Abrir sala");
		expect(sessionOpensSala("preparation")).toBe(true);
		expect(sessionOpensSala("lobby")).toBe(false);
	});

	it("sala viva ofrece Entrar", () => {
		expect(sessionCta("lobby", "row")).toBe("Entrar");
		expect(sessionCta("in_progress", "hero")).toBe("Entrar a la sala");
	});
});

describe("othersHeading", () => {
	it("no dice abiertas si las otras son programadas", () => {
		expect(othersHeading([prep])).toBe("Programadas");
	});

	it("dice También abiertas si hay salas vivas", () => {
		expect(othersHeading([live])).toBe("También abiertas");
	});

	it("dice Otras si mezcla vivas y programadas", () => {
		expect(othersHeading([live, prep])).toBe("Otras");
	});
});
