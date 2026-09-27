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
	it("devuelve las Preguntas del pool de una Sesión con el autor", async () => {
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
		expect(pool[0]?.text).toBe("¿Qué opinas del capítulo 2?");
		expect(pool[0]?.authorName).toBe("Autor");
		expect(from).toHaveBeenCalledWith("questions");
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

		const pools = await getSessionPools({ from }, [sessionId, otherSession]);

		expect(from).toHaveBeenCalledTimes(1);
		expect(inFilter).toHaveBeenCalledWith("session_id", [
			sessionId,
			otherSession,
		]);
		expect(pools.get(sessionId)?.[0]?.text).toBe("¿Capítulo 2?");
		expect(pools.get(otherSession)?.[0]?.text).toBe("¿Capítulo 5?");
	});

	it("no consulta si no hay Sesiones y deja listas vacías", async () => {
		const from = vi.fn();
		const pools = await getSessionPools({ from }, []);
		expect(from).not.toHaveBeenCalled();
		expect(pools.size).toBe(0);
	});
});
