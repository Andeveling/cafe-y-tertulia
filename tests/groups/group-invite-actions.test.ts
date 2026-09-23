import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createInviteLink,
	revokeInviteLink,
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

vi.mock("@/app/g/_lib/group-invite", () => ({
	signGroupInviteToken: vi.fn().mockResolvedValue("signed-token"),
	hashGroupInviteToken: vi.fn((t: string) => `hash:${t}`),
	verifyGroupInviteToken: vi.fn(),
	groupInviteUrl: (token: string) => `https://app.test/g/unirse?token=${token}`,
}));

const userId = "11111111-1111-1111-1111-111111111111";
const groupId = "22222222-2222-2222-2222-222222222222";
const inviteId = "44444444-4444-4444-4444-444444444444";

function mockClient(opts: {
	active: boolean;
	ownRole?: "admin" | "member" | null;
	rpcData?: unknown;
}) {
	const rpc = vi
		.fn()
		.mockResolvedValue({ data: opts.rpcData ?? null, error: null });
	const from = vi.fn().mockImplementation((table: string) => {
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
		if (table === "group_invites") {
			const updateEq = vi.fn().mockResolvedValue({ error: null });
			const deleteEqEq = vi.fn().mockResolvedValue({ error: null });
			const deleteEq = vi.fn().mockReturnValue({ eq: deleteEqEq });
			return {
				update: vi.fn().mockReturnValue({ eq: updateEq }),
				delete: vi.fn().mockReturnValue({ eq: deleteEq }),
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

describe("createInviteLink", () => {
	it("solo admin genera enlaces (patrón ADR-0011)", async () => {
		const { rpc } = mockClient({ active: true, ownRole: "member" });
		const result = await createInviteLink(groupId);
		expect(result.ok).toBe(false);
		expect(rpc).not.toHaveBeenCalled();
	});

	it("admin obtiene URL firmada y guarda el hash", async () => {
		const { rpc, from } = mockClient({
			active: true,
			ownRole: "admin",
			rpcData: inviteId,
		});
		const result = await createInviteLink(groupId);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.url).toContain("/g/unirse?token=");
		expect(rpc).toHaveBeenCalledWith("invite_to_group", {
			p_group_id: groupId,
		});
		expect(from).toHaveBeenCalledWith("group_invites");
	});
});

describe("revokeInviteLink", () => {
	it("revocar elimina la invitación para que el enlace deje de valer", async () => {
		const { from } = mockClient({ active: true, ownRole: "admin" });
		const result = await revokeInviteLink(groupId, inviteId);
		expect(result).toEqual({ ok: true });
		expect(from).toHaveBeenCalledWith("group_invites");
	});

	it("miembro no revoca", async () => {
		mockClient({ active: true, ownRole: "member" });
		const result = await revokeInviteLink(groupId, inviteId);
		expect(result.ok).toBe(false);
	});
});
