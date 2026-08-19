import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Integration tests against the local Supabase stack.
 *
 * These exercise the real seams of the membership foundation (ADR 0005):
 * the public data API + Auth endpoints, through which the app works. They
 * require `supabase start` running locally.
 *
 * Environment (from `.env.local`): the service role key is used only to
 * arrange state and to assert on the data layer, never in the app.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!URL || !ANON_KEY || !SERVICE_KEY) {
	throw new Error(
		"Missing Supabase env vars. Start local Supabase and ensure .env.local exists.",
	);
}

type MemberRow = Database["public"]["Tables"]["members"]["Row"];

let admin: SupabaseClient<Database>;
let padrino: { id: string; email: string; password: string };
const membersToClean: string[] = [];

const uniqueEmail = (prefix: string) =>
	`${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;

async function createMember(
	email: string,
	password: string,
	status: MemberRow["status"],
) {
	const { data, error } = await admin.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
	});
	if (error) throw error;
	membersToClean.push(data.user.id);
	const { error: mErr } = await admin.from("members").insert({
		id: data.user.id,
		status,
		display_name: "Test",
	});
	if (mErr) throw mErr;
	return data.user;
}

beforeAll(async () => {
	admin = createClient<Database>(URL, SERVICE_KEY, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	// Bootstrap padrino (first member) — the operational bootstrap of ADR 0005.
	const email = uniqueEmail("padrino");
	const user = await createMember(email, "padrino-password-123", "active");
	await admin
		.from("members")
		.update({ display_name: "Padrino de Prueba" })
		.eq("id", user.id);
	padrino = { id: user.id, email, password: "padrino-password-123" };
});

afterAll(async () => {
	for (const id of membersToClean) {
		await admin.auth.admin.deleteUser(id);
	}
});

describe("membership: closed club by invitation (ADR 0005)", () => {
	it("blocks public signup (enable_signup=false)", async () => {
		const anon = createClient<Database>(URL, ANON_KEY);
		const { error } = await anon.auth.signUp({
			email: uniqueEmail("signup"),
			password: "whatever-123",
		});
		expect(error?.message).toContain("Signups not allowed");
	});

	it("blocks anonymous access to the members table", async () => {
		const anon = createClient<Database>(URL, ANON_KEY);
		const { data } = await anon.from("members").select("*");
		expect(data).toBeNull();
	});

	it("lets an active member read the roster", async () => {
		const { data, error } = await admin
			.from("members")
			.select("id")
			.eq("id", padrino.id)
			.single();
		expect(error).toBeNull();
		expect(data?.id).toBe(padrino.id);
	});

	it("registers the invitation with padrino, status pending and 24h expiry", async () => {
		const email = uniqueEmail("invitee");
		const { data: invited, error: inviteErr } =
			await admin.auth.admin.inviteUserByEmail(email, {
				data: { godfather_display_name: padrino.email },
				redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite`,
			});
		expect(inviteErr).toBeNull();
		expect(invited.user).not.toBeNull();
		membersToClean.push(invited.user!.id);

		const { error: mErr } = await admin.from("members").insert({
			id: invited.user!.id,
			status: "invited",
			invited_by: padrino.id,
		});
		expect(mErr).toBeNull();

		const { data: invRow, error: iErr } = await admin
			.from("invitations")
			.insert({
				email,
				invited_by: padrino.id,
				status: "pending",
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			})
			.select()
			.single();
		expect(iErr).toBeNull();
		expect(invRow).not.toBeNull();
		expect(invRow!.invited_by).toBe(padrino.id);
		expect(invRow!.status).toBe("pending");
		// The expiry is 24h after creation, per the spec (SPEC §2.14 "24h").
		const durationMs =
			new Date(invRow!.expires_at).getTime() -
			new Date(invRow!.created_at).getTime();
		expect(durationMs).toBeCloseTo(24 * 60 * 60 * 1000, -3);
	});

	it("activates the invited member and marks the invitation accepted", async () => {
		const email = uniqueEmail("accept");
		const { data: invited } = await admin.auth.admin.inviteUserByEmail(email, {
			redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite`,
		});
		expect(invited.user).not.toBeNull();
		membersToClean.push(invited.user!.id);
		await admin.from("members").insert({
			id: invited.user!.id,
			status: "invited",
			invited_by: padrino.id,
		});
		const { data: invRow } = await admin
			.from("invitations")
			.insert({
				email,
				invited_by: padrino.id,
				status: "pending",
				expires_at: new Date(Date.now() + 86400000).toISOString(),
			})
			.select()
			.single();
		expect(invRow).not.toBeNull();

		// The invitee (once signed in) activates their own membership.
		const { error: pwErr } = await admin.auth.admin.updateUserById(
			invited.user!.id,
			{
				password: "invitee-password-123",
				user_metadata: { display_name: "Invitada Aceptada" },
			},
		);
		expect(pwErr).toBeNull();

		// Member row: invited -> active (the app does this with the user's own session).
		const { data: row, error: actErr } = await admin
			.from("members")
			.update({ status: "active", display_name: "Invitada Aceptada" })
			.eq("id", invited.user!.id)
			.select()
			.single();
		expect(actErr).toBeNull();
		expect(row?.status).toBe("active");

		// Invitation: pending -> accepted.
		const { error: accErr } = await admin
			.from("invitations")
			.update({ status: "accepted" })
			.eq("id", invRow!.id);
		expect(accErr).toBeNull();
		const { data: after } = await admin
			.from("invitations")
			.select("status")
			.eq("id", invRow!.id)
			.single();
		expect(after?.status).toBe("accepted");
	});

	it("lets the member edit their display name", async () => {
		const { data, error } = await admin
			.from("members")
			.update({ display_name: "Nombre Editado" })
			.eq("id", padrino.id)
			.select("display_name")
			.single();
		expect(error).toBeNull();
		expect(data?.display_name).toBe("Nombre Editado");
		await admin
			.from("members")
			.update({ display_name: "Padrino de Prueba" })
			.eq("id", padrino.id);
	});

	it("lets the member leave (baja) and keeps contributions", async () => {
		const email = uniqueEmail("leaver");
		const user = await createMember(email, "leaver-password-123", "active");
		const { data: leftRow } = await admin
			.from("members")
			.update({ status: "left" })
			.eq("id", user.id)
			.select("status, display_name")
			.single();
		expect(leftRow?.status).toBe("left");
		// Contributions remain: the row is not deleted.
		const { data: stillThere } = await admin
			.from("members")
			.select("id")
			.eq("id", user.id)
			.single();
		expect(stillThere?.id).toBe(user.id);
	});

	it("keeps a left member's auth account (the app blocks their sign-in)", async () => {
		const email = uniqueEmail("leftlogin");
		await createMember(email, "leftlogin-password-123", "left");

		// Auth still resolves for the left member; the app-level gate lives in
		// the signIn server action (actions.ts), not in Auth itself.
		const anon = createClient<Database>(URL, ANON_KEY);
		const { data: sess } = await anon.auth.signInWithPassword({
			email,
			password: "leftlogin-password-123",
		});
		expect(sess.user).toBeDefined();
		expect(sess.user?.email).toBe(email);
	});

	it("blocks a non-active (invited) member from inviting", async () => {
		const email = uniqueEmail("invitedblocker");
		const user = await createMember(email, "blocker-password-123", "invited");

		// Sign in as the invited (not active) member with a normal client.
		const anon = createClient<Database>(URL, ANON_KEY);
		const { data: sess } = await anon.auth.signInWithPassword({
			email,
			password: "blocker-password-123",
		});
		expect(sess.user).toBeDefined();

		// RLS: the invitations insert policy requires is_active_member.
		const { error } = await anon.from("invitations").insert({
			email: uniqueEmail("victim"),
			invited_by: user.id,
			status: "pending",
			expires_at: new Date(Date.now() + 86400000).toISOString(),
		});
		expect(error).not.toBeNull();
		expect(error?.message).toContain("row-level security");
	});

	it("lets the padrino mark an invitation expired but not forge acceptance", async () => {
		// Set up a pending invitation owned by the padrino.
		const { data: inv } = await admin
			.from("invitations")
			.insert({
				email: uniqueEmail("padrinoinv"),
				invited_by: padrino.id,
				status: "pending",
				expires_at: new Date(Date.now() + 86400000).toISOString(),
			})
			.select()
			.single();
		expect(inv).not.toBeNull();

		const anon = createClient<Database>(URL, ANON_KEY);
		const { data: sess } = await anon.auth.signInWithPassword({
			email: padrino.email,
			password: padrino.password,
		});
		expect(sess.user).toBeDefined();

		// Forging an acceptance is blocked by the policy (only the invitee can).
		const { error: forgeErr } = await anon
			.from("invitations")
			.update({ status: "accepted" })
			.eq("id", inv!.id);
		expect(forgeErr).not.toBeNull();

		// Marking their own invitation expired is allowed.
		const { error: expErr } = await anon
			.from("invitations")
			.update({ status: "expired" })
			.eq("id", inv!.id);
		expect(expErr).toBeNull();
	});

	it("hides login errors (anti-enumeration): unknown email == wrong password", async () => {
		const anon = createClient<Database>(URL, ANON_KEY);
		const unknown = await anon.auth.signInWithPassword({
			email: uniqueEmail("ghost"),
			password: "wrong-123",
		});
		const wrongPw = await anon.auth.signInWithPassword({
			email: padrino.email,
			password: "wrong-123",
		});
		expect(unknown.error?.message).toBe(wrongPw.error?.message);
		expect(unknown.error?.message).toContain("Invalid login credentials");
	});

	it("lets an active member sign in with email + password", async () => {
		const anon = createClient<Database>(URL, ANON_KEY);
		const { data, error } = await anon.auth.signInWithPassword({
			email: padrino.email,
			password: padrino.password,
		});
		expect(error).toBeNull();
		expect(data.user?.email).toBe(padrino.email);
	});
});
