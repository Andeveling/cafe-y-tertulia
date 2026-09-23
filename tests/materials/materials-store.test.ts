import { beforeEach, describe, expect, it, vi } from "vitest";
import * as serverClient from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

// cache() de React memoiza por request en RSC; en tests sería memo global
// entre casos, así que lo pasamos como identidad.
vi.mock("react", async (importOriginal) => ({
	...((await importOriginal()) as object),
	cache: <T>(fn: T): T => fn,
}));

import {
	findMaterialById,
	listMaterials,
} from "@/app/materials/_lib/materials-store";

const ROW = {
	id: "m1",
	title: "Rayuela",
	kind: "book",
	author: "Cortázar",
	status: "in_progress",
	created_at: "2026-01-02T00:00:00.000Z",
	image_url: null,
	source_url: null,
	rating_avg: 4.5,
	rating_count: 2,
} as const;

function mockListClient(rows: unknown, error: unknown = null) {
	const order = vi.fn().mockResolvedValue({ data: rows, error });
	const eq = vi.fn().mockReturnValue({ order });
	const select = vi.fn().mockReturnValue({ eq });
	vi.mocked(serverClient.createClient).mockResolvedValue({
		from: vi.fn().mockReturnValue({ select }),
	} as never);
}

function mockDetailClient(data: unknown, error: unknown = null) {
	const maybeSingle = vi.fn().mockResolvedValue({ data, error });
	const eq = vi.fn().mockReturnValue({ maybeSingle });
	const select = vi.fn().mockReturnValue({ eq });
	vi.mocked(serverClient.createClient).mockResolvedValue({
		from: vi.fn().mockReturnValue({ select }),
	} as never);
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("listMaterials", () => {
	it("mapea sessions a sessions_count", async () => {
		mockListClient([
			{ ...ROW, sessions: [{ id: "s1" }, { id: "s2" }] },
			{ ...ROW, id: "m2", sessions: [] },
		]);
		const result = await listMaterials("g1");
		expect(result.map((m) => [m.id, m.sessions_count])).toEqual([
			["m1", 2],
			["m2", 0],
		]);
	});

	it("lanza el error de Supabase", async () => {
		mockListClient(null, new Error("db caída"));
		await expect(listMaterials("g1")).rejects.toThrow("db caída");
	});
});

describe("findMaterialById", () => {
	it("ordena sesiones por created_at descendente", async () => {
		mockDetailClient({
			...ROW,
			sessions: [
				{
					id: "old",
					created_at: "2026-01-01T00:00:00.000Z",
					status: "closed",
				},
				{
					id: "new",
					created_at: "2026-02-01T00:00:00.000Z",
					status: "lobby",
				},
			],
		});
		const result = await findMaterialById("m1");
		expect(result?.sessions.map((s) => s.id)).toEqual(["new", "old"]);
	});

	it("devuelve null cuando el material no existe", async () => {
		mockDetailClient(null);
		await expect(findMaterialById("nope")).resolves.toBeNull();
	});

	it("lanza el error de Supabase", async () => {
		mockDetailClient(null, new Error("db caída"));
		await expect(findMaterialById("m1")).rejects.toThrow("db caída");
	});
});
