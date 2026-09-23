import { describe, expect, it } from "vitest";

process.env.INVITE_JWT_SECRET = "test-secret-para-grupos-1234567890";
process.env.NEXT_PUBLIC_SITE_URL = "https://app.test";

import {
	groupInviteUrl,
	signGroupInviteToken,
	verifyGroupInviteToken,
} from "@/app/g/_lib/group-invite";

describe("group invite token (patrón ADR-0011)", () => {
	it("firma y verifica el roundtrip grupo + invitación", async () => {
		const token = await signGroupInviteToken({
			inviteId: "inv-1",
			groupId: "g-1",
		});
		const claims = await verifyGroupInviteToken(token);
		expect(claims).toMatchObject({ inviteId: "inv-1", groupId: "g-1" });
	});

	it("rechaza tokens manipulados", async () => {
		const token = await signGroupInviteToken({
			inviteId: "inv-1",
			groupId: "g-1",
		});
		expect(await verifyGroupInviteToken(`${token}x`)).toBeNull();
		expect(await verifyGroupInviteToken("basura")).toBeNull();
	});

	it("la URL apunta al canje /g/unirse", async () => {
		const token = await signGroupInviteToken({
			inviteId: "inv-1",
			groupId: "g-1",
		});
		expect(groupInviteUrl(token)).toBe(
			`https://app.test/g/unirse?token=${encodeURIComponent(token)}`,
		);
	});
});
