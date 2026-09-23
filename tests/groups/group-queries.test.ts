import { describe, expect, it, vi } from "vitest";
import {
	getGroupBySlug,
	getMyGroups,
	getPublicCatalog,
	slugify,
} from "@/lib/groups/queries";

/** Cadena Supabase mínima: cada método devuelve la cadena; el final
 * (order/maybeSingle/await directo) resuelve {data, error} de la tabla. */
function mockClient(rows: Record<string, unknown[]>) {
	const from = vi.fn().mockImplementation((table: string) => {
		const data = rows[table] ?? [];
		const chain: Record<string, unknown> = {};
		chain.select = vi.fn().mockReturnValue(chain);
		chain.eq = vi.fn().mockReturnValue(chain);
		chain.in = vi.fn().mockReturnValue(chain);
		chain.order = vi.fn().mockResolvedValue({ data, error: null });
		chain.maybeSingle = vi
			.fn()
			.mockResolvedValue({ data: data[0] ?? null, error: null });
		chain.then = (resolve: (v: unknown) => void) =>
			Promise.resolve({ data, error: null }).then(resolve);
		return chain;
	});
	return { from };
}

describe("slugify", () => {
	it("normaliza nombre a slug url-safe", () => {
		expect(slugify("Café y Tertulia")).toBe("cafe-y-tertulia");
		expect(slugify("  Filosofía  101 ")).toBe("filosofia-101");
	});
});

describe("getMyGroups", () => {
	it("filtra por membresía del miembro y expone rol + presencia", async () => {
		const supabase = mockClient({
			group_members: [
				{
					role: "admin",
					group_id: "g1",
					member: { last_seen: new Date().toISOString() },
					group: {
						id: "g1",
						slug: "nojau",
						name: "Nojau",
						description: null,
						avatar: null,
						visibility: "private",
					},
				},
				{
					role: "member",
					group_id: "g1",
					member: { last_seen: "2020-01-01T00:00:00Z" },
					group: null,
				},
			],
		}) as never;
		const groups = await getMyGroups(supabase, "member-1");
		expect(groups).toHaveLength(1);
		expect(groups[0]).toMatchObject({ slug: "nojau", role: "admin" });
		// 2 membresías en g1, 1 con presencia reciente.
		expect(groups[0]).toMatchObject({ member_count: 2, online_count: 1 });
	});

	it("devuelve lista vacía cuando el miembro no tiene grupos", async () => {
		const supabase = mockClient({ group_members: [] }) as never;
		const groups = await getMyGroups(supabase, "member-1");
		expect(groups).toEqual([]);
	});
});

describe("getPublicCatalog", () => {
	it("solo expone públicas con conteos y sin contenido interno", async () => {
		const supabase = mockClient({
			groups: [
				{
					id: "g1",
					slug: "abierto",
					name: "Abierto",
					description: "d",
					avatar: null,
					visibility: "public",
				},
			],
			group_members: [{ group_id: "g1" }, { group_id: "g1" }],
			materials: [{ group_id: "g1" }],
			sessions: [],
		}) as never;
		const catalog = await getPublicCatalog(supabase);
		expect(catalog).toHaveLength(1);
		expect(catalog[0]).not.toHaveProperty("questions");
		expect(catalog[0]).not.toHaveProperty("materials");
		expect(catalog[0]).toMatchObject({
			visibility: "public",
			member_count: 2,
			material_count: 1,
			session_count: 0,
		});
	});

	it("nunca incluye grupos privados", async () => {
		const supabase = mockClient({ groups: [] }) as never;
		const catalog = await getPublicCatalog(supabase);
		expect(catalog.every((g) => g.visibility === "public")).toBe(true);
	});
});

describe("getGroupBySlug", () => {
	it("resuelve grupo + rol del miembro", async () => {
		const supabase = mockClient({
			groups: [
				{
					id: "g1",
					slug: "nojau",
					name: "Nojau",
					description: null,
					avatar: null,
					visibility: "private",
				},
			],
			group_members: [{ role: "member" }],
		}) as never;
		const group = await getGroupBySlug(supabase, "nojau", "member-1");
		expect(group).toMatchObject({ slug: "nojau", role: "member" });
	});
});
