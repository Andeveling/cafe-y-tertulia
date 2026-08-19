import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inviteMember } from "@/lib/memberships/invite";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Integration tests for the inviteMember server module (the padrinazgo flow).
 * Runs against the local Supabase stack.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!URL || !SERVICE_KEY) {
	throw new Error(
		"Missing Supabase env vars. Start local Supabase and ensure .env.local exists.",
	);
}

let admin: SupabaseClient<Database>;
let padrino: { id: string; email: string };
const usersToClean: string[] = [];

const uniqueEmail = (prefix: string) =>
	`${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;

/** Find an auth user by email (admin listUsers, all pages). */
async function findUserByEmail(email: string) {
	for (let page = 1; ; page++) {
		const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
		const user = data?.users.find((u) => u.email === email);
		if (user) return user;
		const nextPage =
			"nextPage" in (data ?? {})
				? (data as { nextPage: number | null }).nextPage
				: null;
		if (!data || nextPage === null || page >= nextPage) return null;
	}
}

beforeAll(async () => {
	admin = createClient<Database>(URL, SERVICE_KEY, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
	const email = uniqueEmail("padrino");
	const { data, error } = await admin.auth.admin.createUser({
		email,
		password: "padrino-password-123",
		email_confirm: true,
	});
	if (error) throw error;
	usersToClean.push(data.user.id);
	await admin.from("members").insert({
		id: data.user.id,
		status: "active",
		display_name: "Padrino de Prueba",
	});
	padrino = { id: data.user.id, email };
});

afterAll(async () => {
	for (const id of usersToClean) {
		await admin.auth.admin.deleteUser(id);
	}
});

describe("inviteMember (padrinazgo, ADR 0005)", () => {
	it("invites a new person: auth user + invited member + pending invitation", async () => {
		const email = uniqueEmail("invitee");
		const result = await inviteMember({
			email,
			padrinoId: padrino.id,
			padrinoDisplayName: "Padrino de Prueba",
		});
		expect(result.ok).toBe(true);

		// The auth user exists with the padrino's name in the invite metadata.
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		// The members row is 'invited' with the padrino recorded.
		const { data: member } = await admin
			.from("members")
			.select("status, invited_by")
			.eq("id", user!.id)
			.single();
		expect(member?.status).toBe("invited");
		expect(member?.invited_by).toBe(padrino.id);

		// One pending invitation with a 24h expiry.
		const { data: invites } = await admin
			.from("invitations")
			.select("status, expires_at")
			.eq("email", email);
		expect(invites).toHaveLength(1);
		expect(invites![0].status).toBe("pending");
		const durationMs = new Date(invites![0].expires_at).getTime() - Date.now();
		expect(durationMs).toBeGreaterThan(23 * 60 * 60 * 1000);
		expect(durationMs).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
	});

	it("blocks a second invite while the first is still live", async () => {
		const email = uniqueEmail("dup");
		const first = await inviteMember({
			email,
			padrinoId: padrino.id,
			padrinoDisplayName: "Padrino",
		});
		expect(first.ok).toBe(true);
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		const second = await inviteMember({
			email,
			padrinoId: padrino.id,
			padrinoDisplayName: "Padrino",
		});
		expect(second.ok).toBe(false);
		expect("code" in second && second.code).toBe("already_invited_pending");
	});

	it("re-invites after the previous invitation expired", async () => {
		const email = uniqueEmail("reinvite");
		const first = await inviteMember({
			email,
			padrinoId: padrino.id,
			padrinoDisplayName: "Padrino",
		});
		expect(first.ok).toBe(true);
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		// Expire the live invitation (24h pass) but keep it 'pending'.
		await admin
			.from("invitations")
			.update({ expires_at: new Date(Date.now() - 1000).toISOString() })
			.eq("email", email);

		const second = await inviteMember({
			email,
			padrinoId: padrino.id,
			padrinoDisplayName: "Padrino",
		});
		expect(second.ok).toBe(true);

		// Exactly one live invitation; the expired one was closed.
		const { data: invites } = await admin
			.from("invitations")
			.select("status")
			.eq("email", email)
			.order("created_at", { ascending: true });
		expect(invites).toHaveLength(2);
		expect(invites![0].status).toBe("expired");
		expect(invites![1].status).toBe("pending");
	});

	it("blocks inviting an existing active member", async () => {
		const email = uniqueEmail("existing");
		const { data: u, error } = await admin.auth.admin.createUser({
			email,
			password: "existing-password-123",
			email_confirm: true,
		});
		expect(error).toBeNull();
		const existingId = u!.user!.id;
		usersToClean.push(existingId);
		await admin.from("members").insert({
			id: existingId,
			status: "active",
			display_name: "Ya Miembro",
		});

		const result = await inviteMember({
			email,
			padrinoId: padrino.id,
			padrinoDisplayName: "Padrino",
		});
		expect(result.ok).toBe(false);
		expect("code" in result && result.code).toBe("already_member");
	});

	it("blocks inviting a member who left (baja)", async () => {
		const email = uniqueEmail("left");
		const { data: u, error } = await admin.auth.admin.createUser({
			email,
			password: "left-password-123",
			email_confirm: true,
		});
		expect(error).toBeNull();
		const leftId = u!.user!.id;
		usersToClean.push(leftId);
		await admin.from("members").insert({
			id: leftId,
			status: "left",
			display_name: "Ex Miembro",
		});

		const result = await inviteMember({
			email,
			padrinoId: padrino.id,
			padrinoDisplayName: "Padrino",
		});
		expect(result.ok).toBe(false);
		expect("code" in result && result.code).toBe("left_member");
	});
});
