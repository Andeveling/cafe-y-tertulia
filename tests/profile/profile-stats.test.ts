import { describe, expect, it } from "vitest";
import type {
	MemberBadge,
	MemberLevel,
} from "@/app/profile/_lib/gamification-actions";
import {
	levelProgress,
	partitionBadges,
} from "@/app/profile/_lib/profile-stats";

function badge(overrides: Partial<MemberBadge> & { key: string }): MemberBadge {
	return {
		emoji: "🏅",
		name: overrides.key,
		description: "",
		kind: "individual",
		earned: false,
		...overrides,
	};
}

function level(overrides: Partial<MemberLevel>): MemberLevel {
	return {
		level: 1,
		title: "Novato",
		sessionsAttended: 0,
		insigniasCount: 0,
		currentThreshold: 0,
		nextThreshold: 10,
		nextTitle: "Tertuliano",
		nextInsigniasRequired: 0,
		...overrides,
	};
}

describe("partitionBadges", () => {
	it("particiona en una pasada con conteos", () => {
		const badges = [
			badge({ key: "a", kind: "individual", earned: true }),
			badge({ key: "b", kind: "individual", earned: false }),
			badge({ key: "c", kind: "collective", earned: true }),
		];
		const p = partitionBadges(badges);
		expect(p.individual.map((b) => b.key)).toEqual(["a", "b"]);
		expect(p.collective.map((b) => b.key)).toEqual(["c"]);
		expect(p.earnedIndividual).toBe(1);
		expect(p.totalIndividual).toBe(2);
		expect(p.earnedCollective).toBe(1);
	});

	it("deduplica claves repetidas del catálogo", () => {
		const badges = [
			badge({ key: "a", kind: "individual", earned: true }),
			badge({ key: "a", kind: "individual", earned: false }),
			badge({ key: "c", kind: "collective", earned: true }),
			badge({ key: "c", kind: "collective", earned: true }),
		];
		const p = partitionBadges(badges);
		expect(p.individual.map((b) => b.key)).toEqual(["a"]);
		expect(p.collective.map((b) => b.key)).toEqual(["c"]);
		expect(p.totalIndividual).toBe(1);
		expect(p.earnedCollective).toBe(1);
	});

	it("vacío no rompe", () => {
		expect(partitionBadges([])).toMatchObject({
			earnedIndividual: 0,
			totalIndividual: 0,
			earnedCollective: 0,
		});
	});
});

describe("levelProgress", () => {
	it("calcula porcentaje y faltantes", () => {
		expect(
			levelProgress(level({ sessionsAttended: 3, currentThreshold: 0 })),
		).toEqual({ progress: 30, sessionsToNext: 7 });
	});

	it("clampa a 0–100 y evita división por cero", () => {
		expect(
			levelProgress(
				level({ sessionsAttended: 99, currentThreshold: 5, nextThreshold: 5 }),
			).progress,
		).toBe(100);
		expect(
			levelProgress(level({ sessionsAttended: 0, currentThreshold: 5 }))
				.progress,
		).toBe(0);
	});
});
