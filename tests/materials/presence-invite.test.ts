import { describe, expect, it } from "vitest";
import { buildInviteCandidates } from "@/app/materials/_lib/presence-invite";

const roster = [
	{ id: "m-1", display_name: "Ana" },
	{ id: "m-2", display_name: "Luis" },
	{ id: "m-3", display_name: "Mia" },
	{ id: "m-4", display_name: "Zoe" },
];

describe("buildInviteCandidates", () => {
	it("excluye presentes y al propio moderador", () => {
		const out = buildInviteCandidates({
			roster,
			onlineIds: new Set(["m-2", "m-3"]),
			participantIds: new Set(["m-1"]),
			selfId: "m-1",
		});
		expect(out.map((c) => c.id)).toEqual(["m-2", "m-3", "m-4"]);
	});

	it("ordena online primero y luego por nombre", () => {
		const out = buildInviteCandidates({
			roster,
			onlineIds: ["m-4"],
			participantIds: [],
		});
		expect(out.map((c) => c.id)).toEqual(["m-4", "m-1", "m-2", "m-3"]);
		expect(out[0].online).toBe(true);
		expect(out[1].online).toBe(false);
	});

	it("marca pending sin excluir", () => {
		const out = buildInviteCandidates({
			roster,
			onlineIds: new Set(["m-2"]),
			participantIds: new Set(),
			pendingIds: new Set(["m-2"]),
			selfId: "m-9",
		});
		expect(out.find((c) => c.id === "m-2")?.pending).toBe(true);
		expect(out.find((c) => c.id === "m-3")?.pending).toBe(false);
	});

	it("con estados: solo en_linea y ausente son llamables, en_sesion no", () => {
		const out = buildInviteCandidates({
			roster,
			onlineIds: [],
			participantIds: [],
			estados: {
				"m-1": "en_linea",
				"m-2": "ausente",
				"m-3": "en_sesion",
				"m-4": "desconectado",
			},
		});
		expect(out.map((c) => c.id)).toEqual(["m-1", "m-2", "m-3", "m-4"]);
		expect(out.find((c) => c.id === "m-1")?.llamable).toBe(true);
		expect(out.find((c) => c.id === "m-2")?.llamable).toBe(true);
		expect(out.find((c) => c.id === "m-3")).toMatchObject({
			llamable: false,
			enOtraSala: true,
		});
		expect(out.find((c) => c.id === "m-4")?.llamable).toBe(false);
	});
});
