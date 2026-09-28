import { describe, expect, it, vi } from "vitest";
import {
	getSessionPool,
	getSessionPools,
} from "@/app/materials/_lib/questions";

// Fixture: un Miembro activo (autor), una Sesión en preparation y su Material.
const sessionId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const materialId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const authorId = "11111111-1111-1111-1111-111111111111";

describe("getSessionPool", () => {
	it("devuelve el texto solo a su autor; al resto les llega null", async () => {
		const otherId = "22222222-2222-2222-2222-222222222222";
		const rows = [
			{
				id: "q1",
				session_id: sessionId,
				material_id: materialId,
				author_id: authorId,
				text: "¿Qué opinas del capítulo 2?",
				outside_draw: false,
				created_at: "2026-08-19T10:00:00Z",
				members: { display_name: "Autor" },
			},
		];
		const order = vi.fn().mockResolvedValue({ data: rows, error: null });
		const eq = vi.fn().mockReturnValue({ order });
		const select = vi.fn().mockReturnValue({ eq });
		const from = vi.fn().mockReturnValue({ select });

		const mine = await getSessionPool({ from }, sessionId, authorId);

		expect(mine).toHaveLength(1);
		expect(mine[0]?.text).toBe("¿Qué opinas del capítulo 2?");
		expect(mine[0]?.authorName).toBe("Autor");
		expect(from).toHaveBeenCalledWith("questions");

		const theirs = await getSessionPool({ from }, sessionId, otherId);

		expect(theirs).toHaveLength(1);
		expect(theirs[0]?.text).toBeNull();
		expect(theirs[0]?.authorName).toBe("Autor");
	});

	it("oculta todos los textos si no hay visor", async () => {
		const rows = [
			{
				id: "q1",
				session_id: sessionId,
				material_id: materialId,
				author_id: authorId,
				text: "¿Qué opinas del capítulo 2?",
				outside_draw: false,
				created_at: "2026-08-19T10:00:00Z",
				members: { display_name: "Autor" },
			},
		];
		const order = vi.fn().mockResolvedValue({ data: rows, error: null });
		const eq = vi.fn().mockReturnValue({ order });
		const select = vi.fn().mockReturnValue({ eq });
		const from = vi.fn().mockReturnValue({ select });

		const pool = await getSessionPool({ from }, sessionId);

		expect(pool).toHaveLength(1);
		expect(pool[0]?.text).toBeNull();
	});

	it("devuelve lista vacía si la Sesión no tiene Preguntas", async () => {
		const order = vi.fn().mockResolvedValue({ data: [], error: null });
		const eq = vi.fn().mockReturnValue({ order });
		const select = vi.fn().mockReturnValue({ eq });
		const from = vi.fn().mockReturnValue({ select });

		const pool = await getSessionPool({ from }, sessionId);

		expect(pool).toEqual([]);
	});

	it("lanza error si la consulta falla", async () => {
		const order = vi
			.fn()
			.mockResolvedValue({ data: null, error: new Error("boom") });
		const eq = vi.fn().mockReturnValue({ order });
		const select = vi.fn().mockReturnValue({ eq });
		const from = vi.fn().mockReturnValue({ select });

		await expect(getSessionPool({ from }, sessionId)).rejects.toThrow("boom");
	});
});

describe("getSessionPools", () => {
	it("agrupa Preguntas de varias Sesiones en una lectura", async () => {
		const otherSession = "cccccccc-cccc-cccc-cccc-cccccccccccc";
		const rows = [
			{
				id: "q1",
				session_id: sessionId,
				material_id: materialId,
				author_id: authorId,
				text: "¿Capítulo 2?",
				outside_draw: false,
				created_at: "2026-08-19T10:00:00Z",
				members: { display_name: "Autor" },
			},
			{
				id: "q2",
				session_id: otherSession,
				material_id: materialId,
				author_id: authorId,
				text: "¿Capítulo 5?",
				outside_draw: false,
				created_at: "2026-08-19T11:00:00Z",
				members: { display_name: "Autor" },
			},
		];
		const order = vi.fn().mockResolvedValue({ data: rows, error: null });
		const inFilter = vi.fn().mockReturnValue({ order });
		const select = vi.fn().mockReturnValue({ in: inFilter });
		const from = vi.fn().mockReturnValue({ select });

		const pools = await getSessionPools(
			{ from },
			[sessionId, otherSession],
			authorId,
		);

		expect(from).toHaveBeenCalledTimes(1);
		expect(inFilter).toHaveBeenCalledWith("session_id", [
			sessionId,
			otherSession,
		]);
		expect(pools.get(sessionId)?.[0]?.text).toBe("¿Capítulo 2?");
		expect(pools.get(otherSession)?.[0]?.text).toBe("¿Capítulo 5?");

		const hidden = await getSessionPools(
			{ from },
			[sessionId, otherSession],
			"22222222-2222-2222-2222-222222222222",
		);

		expect(hidden.get(sessionId)?.[0]?.text).toBeNull();
		expect(hidden.get(otherSession)?.[0]?.text).toBeNull();
	});

	it("no consulta si no hay Sesiones y deja listas vacías", async () => {
		const from = vi.fn();
		const pools = await getSessionPools({ from }, []);
		expect(from).not.toHaveBeenCalled();
		expect(pools.size).toBe(0);
	});
});
