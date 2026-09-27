import { describe, expect, it } from "vitest";
import { buildRoster, countOnline } from "@/lib/presencia/roster";

// El seam bajo prueba es el roster de Presencia: dados miembros + tracks
// del canal, una sola derivación ordenada con conteo. Sin canal ni reloj.
const ahora = 1_000_000_000_000;

const ana = {
	id: "m-1",
	display_name: "Ana",
	avatar: null,
	last_seen: null,
};
const luis = {
	id: "m-2",
	display_name: "Luis",
	avatar: null,
	last_seen: new Date(ahora - 10_000).toISOString(),
};

describe("buildRoster", () => {
	it("con grupo, sin track en el canal es offline aunque last_seen sea fresco", () => {
		const roster = buildRoster({
			members: [ana, luis],
			tracks: {},
			ahora,
			groupId: "g-1",
		});

		expect(roster.map((m) => m.online)).toEqual([false, false]);
		expect(roster.find((m) => m.id === "m-2")?.ultimaVez).toBeNull();
	});

	it("sin grupo, last_seen fresco dentro de la gracia sigue vivo", () => {
		const roster = buildRoster({
			members: [luis],
			tracks: {},
			ahora,
		});

		expect(roster[0]?.online).toBe(true);
	});

	it("el track marca En línea y detecta otra Sala", () => {
		const roster = buildRoster({
			members: [ana],
			tracks: { "m-1": [{ last_active: ahora, session_id: "sala-9" }] },
			ahora,
			groupId: "g-1",
			salaId: "sala-1",
		});

		expect(roster[0]?.online).toBe(true);
		expect(roster[0]?.enOtraSala).toBe(true);
		expect(roster[0]?.estado).toBe("en_sesion");
	});

	it("ordena En línea primero", () => {
		const roster = buildRoster({
			members: [ana, luis],
			tracks: { "m-2": [{ last_active: ahora }] },
			ahora,
			groupId: "g-1",
		});

		expect(roster.map((m) => m.id)).toEqual(["m-2", "m-1"]);
	});
});

describe("countOnline", () => {
	it("cuenta una sola vez para todos los rosters", () => {
		const roster = buildRoster({
			members: [ana, luis],
			tracks: { "m-2": [{ last_active: ahora }] },
			ahora,
			groupId: "g-1",
		});

		expect(countOnline(roster)).toBe(1);
		expect(countOnline([])).toBe(0);
	});
});
