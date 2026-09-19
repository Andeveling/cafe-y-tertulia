import { describe, expect, it } from "vitest";
import {
	type BoardSession,
	editorialTitle,
	matchesFilter,
	othersHeading,
	sessionCta,
	sessionHref,
	sessionOpensSala,
	sessionSubtitle,
	splitHeadline,
} from "@/app/_components/board-helpers";

const prep: BoardSession = {
	id: "cap-10",
	status: "preparation",
	scheduled_at: "2026-09-14T00:00:00Z",
	range: "Capitulo 10",
	moderator_id: "u1",
	moderator_name: "Andrés",
	moderator_avatar: "/avatars/Avatar01.svg",
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
		expect(sessionHref(prep)).toBe("/materials/sessions/cap-10/room");
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

describe("editorialTitle", () => {
	it("prioriza el material sobre el rango", () => {
		expect(editorialTitle(prep)).toBe("Hyperfocus");
		expect(sessionSubtitle(prep)).toBe("Capitulo 10");
	});

	it("cae al rango si no hay material", () => {
		expect(editorialTitle({ ...prep, material_title: null })).toBe(
			"Capitulo 10",
		);
		expect(sessionSubtitle({ ...prep, material_title: null })).toBeNull();
	});
});

describe("splitHeadline", () => {
	it("separa el acento después de dos puntos", () => {
		expect(splitHeadline("El olvido que seremos: memoria y perdón")).toEqual({
			lead: "El olvido que seremos:",
			accent: "memoria y perdón",
		});
	});

	it("sin dos puntos deja el título entero", () => {
		expect(splitHeadline("Hyperfocus")).toEqual({
			lead: "Hyperfocus",
			accent: null,
		});
	});
});

describe("matchesFilter", () => {
	it("live solo deja salas abiertas", () => {
		expect(matchesFilter(live, "live")).toBe(true);
		expect(matchesFilter(prep, "live")).toBe(false);
		expect(matchesFilter(prep, "scheduled")).toBe(true);
		expect(matchesFilter(live, "all")).toBe(true);
	});
});
