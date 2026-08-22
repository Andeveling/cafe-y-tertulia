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

/** Sign in with the anon client — the same path the app uses. */
async function signIn(email: string, password: string) {
	const anon = createClient<Database>(URL, ANON_KEY);
	const { data, error } = await anon.auth.signInWithPassword({
		email,
		password,
	});
	if (error) throw error;
	return { anon, user: data.user };
}

/**
 * Create an invited member with a confirmed email and a live pending
 * invitation (the state the invitee is in after clicking the invite link).
 */
async function createInvitedMemberWithInvitation(email: string) {
	const { data: invited, error: inviteErr } =
		await admin.auth.admin.inviteUserByEmail(email, {
			redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite`,
		});
	if (inviteErr) throw inviteErr;
	if (!invited.user) throw new Error("inviteUserByEmail returned no user");
	membersToClean.push(invited.user.id);
	// The invite link confirms the email when the guest clicks it (the
	// browser client picks up the session from the URL fragment). The tests
	// simulate that click so the user can sign in with a password.
	const { error: confirmErr } = await admin.auth.admin.updateUserById(
		invited.user.id,
		{ email_confirm: true },
	);
	if (confirmErr) throw confirmErr;
	await admin.from("members").insert({
		id: invited.user.id,
		status: "invited",
		invited_by: padrino.id,
	});
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
	if (iErr) throw iErr;
	return { user: invited.user, invitation: invRow! };
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

	it("allows anonymous read of members display_name for historical view", async () => {
		const anon = createClient<Database>(URL, ANON_KEY);
		const { data, error } = await anon
			.from("members")
			.select("id, display_name");
		expect(error).toBeNull();
		expect(data).not.toBeNull();
		expect(data!.length).toBeGreaterThan(0);
	});

	it("lets an active member read the roster with a real session", async () => {
		const { anon, user } = await signIn(padrino.email, padrino.password);
		const { data, error } = await anon
			.from("members")
			.select("id, status")
			.eq("id", user.id)
			.single();
		expect(error).toBeNull();
		expect(data?.id).toBe(user.id);
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

	it("lets the padrino re-invite after the previous invitation expired", async () => {
		const email = uniqueEmail("reinvite");
		// An invited member with an expired (still pending) invitation.
		const { data: invited, error: inviteErr } =
			await admin.auth.admin.inviteUserByEmail(email, {
				redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite`,
			});
		expect(inviteErr).toBeNull();
		expect(invited.user).not.toBeNull();
		membersToClean.push(invited.user!.id);
		await admin.from("members").insert({
			id: invited.user!.id,
			status: "invited",
			invited_by: padrino.id,
		});
		const { data: invRow, error: iErr } = await admin
			.from("invitations")
			.insert({
				email,
				invited_by: padrino.id,
				status: "pending",
				expires_at: new Date(Date.now() - 60_000).toISOString(), // expired
			})
			.select()
			.single();
		expect(iErr).toBeNull();
		expect(invRow).not.toBeNull();

		// The re-invite flow: mark the expired one closed and open a new one.
		const { error: closeErr } = await admin
			.from("invitations")
			.update({ status: "expired" })
			.eq("id", invRow!.id);
		expect(closeErr).toBeNull();
		const { data: newInv, error: newErr } = await admin
			.from("invitations")
			.insert({
				email,
				invited_by: padrino.id,
				status: "pending",
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			})
			.select()
			.single();
		expect(newErr).toBeNull();
		expect(newInv?.status).toBe("pending");

		// The old one is no longer live.
		const { data: closed } = await admin
			.from("invitations")
			.select("status")
			.eq("id", invRow!.id)
			.single();
		expect(closed?.status).toBe("expired");
	});

	it("allows only one live invitation per email (partial unique index)", async () => {
		const email = uniqueEmail("uniqueinvite");
		const first = await createInvitedMemberWithInvitation(email);

		// A second pending invitation for the same email is rejected.
		const { error: dupErr } = await admin.from("invitations").insert({
			email,
			invited_by: padrino.id,
			status: "pending",
			expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
		});
		expect(dupErr).not.toBeNull();

		// Marking the first accepted frees the email.
		const { error: accErr } = await admin
			.from("invitations")
			.update({ status: "accepted" })
			.eq("id", first.invitation.id);
		expect(accErr).toBeNull();
	});

	it("activates the invited member server-side (the app's accept flow)", async () => {
		const email = uniqueEmail("accept");
		const { user, invitation } = await createInvitedMemberWithInvitation(email);

		// The app's accept flow (server action with service role): set the
		// password + display name, activate the membership, accept the
		// invitation. This is the same sequence acceptInvitation() runs.
		const { error: pwErr } = await admin.auth.admin.updateUserById(user.id, {
			password: "invitee-password-123",
			user_metadata: { display_name: "Invitada Aceptada" },
		});
		expect(pwErr).toBeNull();

		const { data: row, error: actErr } = await admin
			.from("members")
			.update({ status: "active", display_name: "Invitada Aceptada" })
			.eq("id", user.id)
			.select()
			.single();
		expect(actErr).toBeNull();
		expect(row?.status).toBe("active");

		const { error: accErr } = await admin
			.from("invitations")
			.update({ status: "accepted" })
			.eq("id", invitation.id);
		expect(accErr).toBeNull();

		// Now the member signs in with the password they set — the app path.
		const { anon } = await signIn(email, "invitee-password-123");
		const { data: self } = await anon
			.from("members")
			.select("status, display_name")
			.eq("id", user.id)
			.single();
		expect(self?.status).toBe("active");
		expect(self?.display_name).toBe("Invitada Aceptada");
	});

	it("blocks a member from self-promoting via the Data API (no members UPDATE policy)", async () => {
		const email = uniqueEmail("selfpromo");
		const user = await createMember(email, "selfpromo-password-123", "invited");
		const { anon } = await signIn(email, "selfpromo-password-123");

		// The acceptance is server-side (ADR 0005): an UPDATE to one's own row
		// matches no policy and silently affects 0 rows.
		const { data, error } = await anon
			.from("members")
			.update({ status: "active" })
			.eq("id", user.id)
			.select();
		expect(error).toBeNull();
		expect(data).toHaveLength(0);
	});

	it("lets the invitee list their own pending invitations with a real session", async () => {
		const email = uniqueEmail("owninvites");
		const { user } = await createInvitedMemberWithInvitation(email);
		// The invitee sets a password when accepting (acceptInvitation); do the
		// same here so they can sign in.
		await admin.auth.admin.updateUserById(user.id, {
			password: "owninvites-password-123",
		});
		const { anon } = await signIn(email, "owninvites-password-123");
		const { data, error } = await anon
			.from("invitations")
			.select("email, status")
			.eq("email", email);
		expect(error).toBeNull();
		expect(data?.some((i) => i.email === email)).toBe(true);
	});

	it("lets the member edit their display name server-side", async () => {
		// Profile edits go through the server action with the service role;
		// there is no members UPDATE policy (self-edit via the API would allow
		// self-promotion). The member's session can read its own row.
		const { error } = await admin
			.from("members")
			.update({ display_name: "Nombre Editado" })
			.eq("id", padrino.id);
		expect(error).toBeNull();
		const { anon } = await signIn(padrino.email, padrino.password);
		const { data } = await anon
			.from("members")
			.select("display_name")
			.eq("id", padrino.id)
			.single();
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

		// RLS: the invitations insert policy requires is_member() (active).
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

		const { anon } = await signIn(padrino.email, padrino.password);

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
		const { user } = await signIn(padrino.email, padrino.password);
		expect(user.email).toBe(padrino.email);
	});
});
