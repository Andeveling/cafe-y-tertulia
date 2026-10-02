import type { CallToolResult } from "@modelcontextprotocol/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
	createBibliotecaItem,
	listBibliotecaItems,
	nominateBibliotecaItem,
	withdrawPostulacion,
} from "@/app/api/mcp/route";
import type { Database } from "@/lib/supabase/database.types";

type MockClient = SupabaseClient<Database>;

function mockClient(stubs: Record<string, unknown>): MockClient {
	return stubs as unknown as MockClient;
}

function textOf(result: CallToolResult) {
	const block = result.content.find((item) => item.type === "text");
	if (!block || block.type !== "text")
		throw new Error("el tool no devolvió texto");
	return block.text;
}

describe("mcp: biblioteca_list", () => {
	it("devuelve lo del dueño en JSON", async () => {
		const filas = [
			{ id: "b1", owner_id: "dueña-1", title: "Dune", kind: "book" },
		];
		const order = vi.fn().mockResolvedValue({ data: filas, error: null });
		const eq = vi.fn().mockReturnValue({ order });
		const select = vi.fn().mockReturnValue({ eq });
		const client = mockClient({ from: () => ({ select }) });

		const result = await listBibliotecaItems(client, { userId: "dueña-1" });

		expect(JSON.parse(textOf(result))).toEqual(filas);
		expect(select).toHaveBeenCalledWith(
			"id, owner_id, title, kind, author, image_url, source_url, motive, created_at",
		);
		expect(eq).toHaveBeenCalledWith("owner_id", "dueña-1");
		expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
	});

	it("si la lectura falla lanza el mensaje", async () => {
		const client = mockClient({
			from: () => ({
				select: () => ({
					eq: () => ({
						order: async () => ({
							data: null,
							error: { message: "RLS lo niega" },
						}),
					}),
				}),
			}),
		});
		await expect(
			listBibliotecaItems(client, { userId: "dueña-1" }),
		).rejects.toThrow("RLS lo niega");
	});
});

describe("mcp: biblioteca_create", () => {
	const input = {
		title: "  Dune  ",
		author: "Herbert",
		kind: "book" as const,
	};

	it("normaliza, marca al dueño y devuelve el id", async () => {
		const single = vi
			.fn()
			.mockResolvedValue({ data: { id: "nuevo-1" }, error: null });
		const select = vi.fn().mockReturnValue({ single });
		const insert = vi.fn().mockReturnValue({ select });
		const client = mockClient({ from: () => ({ insert }) });

		const result = await createBibliotecaItem(client, {
			userId: "dueña-1",
			input,
		});

		expect(JSON.parse(textOf(result))).toEqual({ id: "nuevo-1" });
		expect(insert).toHaveBeenCalledWith({
			title: "Dune",
			author: "Herbert",
			kind: "book",
			image_url: null,
			source_url: null,
			motive: null,
			owner_id: "dueña-1",
		});
	});

	it("si el insert falla lanza el mensaje", async () => {
		const client = mockClient({
			from: () => ({
				insert: () => ({
					select: () => ({
						single: async () => ({
							data: null,
							error: { message: "título duplicado" },
						}),
					}),
				}),
			}),
		});
		await expect(
			createBibliotecaItem(client, { userId: "dueña-1", input }),
		).rejects.toThrow("título duplicado");
	});
});

describe("mcp: biblioteca_nominate", () => {
	const args = {
		libraryItemId: "11111111-1111-4111-8111-111111111111",
		groupId: "22222222-2222-4222-8222-222222222222",
	};

	it("llama al RPC y confirma en JSON", async () => {
		const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
		const result = await nominateBibliotecaItem(mockClient({ rpc }), args);

		expect(rpc).toHaveBeenCalledWith("nominate_from_library", {
			p_library_item_id: args.libraryItemId,
			p_group_id: args.groupId,
		});
		expect(JSON.parse(textOf(result))).toEqual({ ok: true });
	});

	it("el error del RPC llega en español como tool error", async () => {
		const rpc = vi
			.fn()
			.mockResolvedValue({ data: null, error: { message: "cupo lleno" } });
		const result = await nominateBibliotecaItem(mockClient({ rpc }), args);

		expect(result.isError).toBe(true);
		expect(textOf(result)).toContain("No se pudo postular el material");
		expect(textOf(result)).toContain("cupo lleno");
	});
});

describe("mcp: postulacion_withdraw", () => {
	const args = { nominationId: "33333333-3333-4333-8333-333333333333" };

	it("llama al RPC y confirma en JSON", async () => {
		const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
		const result = await withdrawPostulacion(mockClient({ rpc }), args);

		expect(rpc).toHaveBeenCalledWith("withdraw_nomination", {
			p_nomination_id: args.nominationId,
		});
		expect(JSON.parse(textOf(result))).toEqual({ ok: true });
	});

	it("el error del RPC llega en español como tool error", async () => {
		const rpc = vi
			.fn()
			.mockResolvedValue({ data: null, error: { message: "ya bloqueada" } });
		const result = await withdrawPostulacion(mockClient({ rpc }), args);

		expect(result.isError).toBe(true);
		expect(textOf(result)).toContain("No se pudo retirar la postulación");
		expect(textOf(result)).toContain("ya bloqueada");
	});
});
