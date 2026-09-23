import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	deleteGroup,
	removeMember,
	updateGroup,
	updateMemberRole,
} from "@/app/g/[slug]/_lib/settings-actions";
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
const otherId = "33333333-3333-3333-3333-333333333333";

/** Cliente con membresía propia configurable (admin/member/none). */
function mockClient(opts: {
	active: boolean;
	ownRole?: "admin" | "member" | null;
	rpcImpl?: (fn: string) => Promise<{ data: unknown; error: null }>;
	tableImpl?: (table: string) => unknown;
}) {
	const rpc = vi
		.fn()
		.mockImplementation(
			(fn: string) =>
				opts.rpcImpl?.(fn) ?? Promise.resolve({ data: null, error: null }),
		);
	const from = vi.fn().mockImplementation((table: string) => {
		if (opts.tableImpl) return opts.tableImpl(table);
		if (table === "groups") {
			return {
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						maybeSingle: vi.fn().mockResolvedValue({
							data: { slug: "nojau" },
							error: null,
						}),
					}),
				}),
			};
		}
		if (table === "group_members") {
			return {
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							maybeSingle: vi.fn().mockResolvedValue({
								data: opts.ownRole == null ? null : { role: opts.ownRole },
								error: null,
							}),
						}),
					}),
				}),
			};
		}
		throw new Error(`tabla inesperada: ${table}`);
	});
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

describe("updateGroup", () => {
	it("rechaza a quien no es admin del grupo", async () => {
		mockClient({ active: true, ownRole: "member" });
		const result = await updateGroup(groupId, { name: "Nuevo" });
		expect(result.ok).toBe(false);
	});

	it("rechaza a no-miembros", async () => {
		mockClient({ active: true, ownRole: null });
		const result = await updateGroup(groupId, { name: "Nuevo" });
		expect(result.ok).toBe(false);
	});

	it("admin edita nombre y visibilidad", async () => {
		const update = vi.fn().mockReturnValue({
			eq: vi.fn().mockResolvedValue({ error: null }),
		});
		mockClient({
			active: true,
			ownRole: "admin",
			tableImpl: (table: string) => {
				if (table === "group_members")
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								eq: vi.fn().mockReturnValue({
									maybeSingle: vi.fn().mockResolvedValue({
										data: { role: "admin" },
										error: null,
									}),
								}),
							}),
						}),
					};
				if (table === "groups") return { update };
				throw new Error(`tabla inesperada: ${table}`);
			},
		});
		const result = await updateGroup(groupId, {
			name: "Nuevo",
			visibility: "public",
		});
		expect(result).toEqual({ ok: true });
		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Nuevo", visibility: "public" }),
		);
	});
});

describe("updateMemberRole", () => {
	it("solo admin nombra co-admins", async () => {
		const { rpc } = mockClient({ active: true, ownRole: "member" });
		const result = await updateMemberRole(groupId, otherId, "admin");
		expect(result.ok).toBe(false);
		expect(rpc).not.toHaveBeenCalled();
	});

	it("admin delega con el RPC", async () => {
		const { rpc } = mockClient({
			active: true,
			ownRole: "admin",
			rpcImpl: () => Promise.resolve({ data: null, error: null }),
		});
		const result = await updateMemberRole(groupId, otherId, "admin");
		expect(result).toEqual({ ok: true });
		expect(rpc).toHaveBeenCalledWith(
			"update_member_role",
			expect.objectContaining({ p_member_id: otherId, p_role: "admin" }),
		);
	});
});

describe("removeMember", () => {
	it("expulsar es solo de admin y no borra aportes (RPC)", async () => {
		const { rpc } = mockClient({
			active: true,
			ownRole: "admin",
			rpcImpl: () => Promise.resolve({ data: null, error: null }),
		});
		const result = await removeMember(groupId, otherId);
		expect(result).toEqual({ ok: true });
		expect(rpc).toHaveBeenCalledWith(
			"remove_member",
			expect.objectContaining({ p_member_id: otherId }),
		);
	});

	it("un miembro no expulsa a otro", async () => {
		const { rpc } = mockClient({ active: true, ownRole: "member" });
		expect((await removeMember(groupId, otherId)).ok).toBe(false);
		expect(rpc).not.toHaveBeenCalled();
	});
});

describe("deleteGroup", () => {
	it("exige doble confirmación con el slug", async () => {
		const { rpc } = mockClient({ active: true, ownRole: "admin" });
		const result = await deleteGroup(groupId, "slug-equivocado");
		expect(result.ok).toBe(false);
		expect(rpc).not.toHaveBeenCalled();
	});

	it("admin + confirmación borra con cascada", async () => {
		const { rpc } = mockClient({
			active: true,
			ownRole: "admin",
			rpcImpl: () => Promise.resolve({ data: null, error: null }),
		});
		const result = await deleteGroup(groupId, "nojau");
		expect(result).toEqual({ ok: true, slug: "nojau" });
		expect(rpc).toHaveBeenCalledWith("delete_group", { p_group_id: groupId });
	});
});
