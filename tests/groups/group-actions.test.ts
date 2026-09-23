import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGroup, joinGroup, leaveGroup } from "@/app/g/_lib/group-actions";
import * as memberRepo from "@/app/materials/_lib/members";
import * as serverClient from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("@/app/materials/_lib/members", () => ({
	isActiveMember: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

const userId = "11111111-1111-1111-1111-111111111111";
const groupId = "22222222-2222-2222-2222-222222222222";

function mockClient(opts: {
	active: boolean;
	rpc?: (fn: string) => { data: unknown; error: null };
	fromImpl?: (table: string) => unknown;
}) {
	const rpc = vi
		.fn()
		.mockImplementation(
			async (fn: string) => opts.rpc?.(fn) ?? { data: null, error: null },
		);
	const from =
		opts.fromImpl != null ? vi.fn().mockImplementation(opts.fromImpl) : vi.fn();
	vi.mocked(serverClient.createClient).mockResolvedValue({
		auth: {
			getUser: vi
				.fn()
				.mockResolvedValue({ data: { user: { id: userId } }, error: null }),
		},
		rpc,
		from,
	} as never);
	vi.mocked(memberRepo.isActiveMember).mockResolvedValue(opts.active);
	return { rpc, from };
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("createGroup", () => {
	it("rechaza a quien no es miembro activo", async () => {
		mockClient({ active: false });
		const result = await createGroup({
			name: "Tertulia",
			visibility: "private",
		});
		expect(result.ok).toBe(false);
	});

	it("crea el grupo y deja al creador como admin", async () => {
		const selectEq = vi.fn().mockReturnValue({
			maybeSingle: vi
				.fn()
				.mockResolvedValue({ data: { slug: "tertulia" }, error: null }),
		});
		const { rpc, from } = mockClient({
			active: true,
			// Contrato #71: create_group devuelve el uuid; el slug lo pone el trigger.
			rpc: () => ({ data: groupId, error: null }),
			fromImpl: (table: string) => {
				if (table === "groups")
					return { select: vi.fn().mockReturnValue({ eq: selectEq }) };
				throw new Error(`tabla inesperada: ${table}`);
			},
		});
		const result = await createGroup({
			name: "Tertulia",
			visibility: "private",
		});
		expect(result).toEqual({ ok: true, slug: "tertulia" });
		expect(rpc).toHaveBeenCalledWith(
			"create_group",
			expect.objectContaining({ p_name: "Tertulia" }),
		);
		expect(from).toHaveBeenCalledWith("groups");
	});

	it("rechaza nombre vacío", async () => {
		mockClient({ active: true });
		const result = await createGroup({ name: "  ", visibility: "public" });
		expect(result.ok).toBe(false);
	});
});

describe("joinGroup", () => {
	it("se une a una pública con Unirse", async () => {
		const { rpc } = mockClient({
			active: true,
			rpc: () => ({ data: null, error: null }),
		});
		const result = await joinGroup(groupId);
		expect(result).toEqual({ ok: true });
		expect(rpc).toHaveBeenCalledWith("join_group", { p_group_id: groupId });
	});
});

describe("leaveGroup", () => {
	it("salir revoca membresía pero no borra aportes (solo group_members)", async () => {
		const del = vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ error: null }),
			}),
		});
		const { from } = mockClient({
			active: true,
			fromImpl: (table: string) => {
				if (table === "group_members") return { delete: del };
				throw new Error(`tabla inesperada: ${table}`);
			},
		});
		const result = await leaveGroup(groupId);
		expect(result).toEqual({ ok: true });
		expect(from).toHaveBeenCalledWith("group_members");
		// Solo toca group_members: preguntas/materiales permanecen.
		expect(from).toHaveBeenCalledTimes(1);
	});
});
