import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	acceptInviteToken,
	createInviteLink,
	inviteLinkFor,
	resendInviteLink,
	revokeInvitation,
} from "@/app/invite/_lib/invite";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Integration tests for the shareable-invite module (ADR 0011).
 * External behavior only: create link → redeem; revoked/expired/used do not
 * enter. Runs against the local Supabase stack.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_KEY =
	process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
	throw new Error(
		"Missing Supabase env vars. Start local Supabase and ensure .env.local exists.",
	);
}

if (!process.env.INVITE_JWT_SECRET) {
	throw new Error("Missing INVITE_JWT_SECRET in .env.local.");
}

type MemberRow = Database["public"]["Tables"]["members"]["Row"];

let admin: SupabaseClient<Database>;
let padrino: { id: string; email: string };
const usersToClean: string[] = [];

const uniqueEmail = (prefix: string) =>
	`${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;

function tokenFromUrl(url: string) {
	const token = new URL(url).searchParams.get("token");
	if (!token) throw new Error(`Invite URL has no token: ${url}`);
	return token;
}

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

async function signIn(email: string, password: string) {
	const anon = createClient<Database>(SUPABASE_URL, ANON_KEY);
	const { data, error } = await anon.auth.signInWithPassword({
		email,
		password,
	});
	if (error) throw error;
	return { anon, user: data.user };
}

beforeAll(async () => {
	admin = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
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

describe("invitación por enlace compartible (ADR 0011)", () => {
	it("crear y canjear deja a la persona activa y puede entrar", async () => {
		const email = uniqueEmail("invitee");
		const created = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(created.ok).toBe(true);
		if (!created.ok) return;

		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		const { data: member } = await admin
			.from("members")
			.select("status, invited_by")
			.eq("id", user!.id)
			.single();
		expect(member?.status).toBe("invited");
		expect(member?.invited_by).toBe(padrino.id);

		const accepted = await acceptInviteToken({
			token: tokenFromUrl(created.url),
			email,
			displayName: "Invitada Nueva",
			password: "invitee-password-123",
		});
		expect(accepted.ok).toBe(true);

		const { anon } = await signIn(email, "invitee-password-123");
		const { data: self } = await anon
			.from("members")
			.select("status, display_name")
			.eq("id", user!.id)
			.single();
		expect(self?.status).toBe("active");
		expect(self?.display_name).toBe("Invitada Nueva");
	});

	it("el canje con un email distinto no entra", async () => {
		const email = uniqueEmail("mismatch");
		const created = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(created.ok).toBe(true);
		if (!created.ok) return;
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		const accepted = await acceptInviteToken({
			token: tokenFromUrl(created.url),
			email: uniqueEmail("other"),
			displayName: "Otra",
			password: "invitee-password-123",
		});
		expect(accepted.ok).toBe(false);

		const { data: member } = await admin
			.from("members")
			.select("status")
			.eq("id", user!.id)
			.single();
		expect(member?.status).toBe("invited");
	});

	it("un enlace caducado no entra", async () => {
		const email = uniqueEmail("expired");
		const created = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(created.ok).toBe(true);
		if (!created.ok) return;
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		await admin
			.from("invitations")
			.update({ expires_at: new Date(Date.now() - 1000).toISOString() })
			.eq("email", email)
			.eq("status", "pending");

		const accepted = await acceptInviteToken({
			token: tokenFromUrl(created.url),
			email,
			displayName: "Tarde",
			password: "invitee-password-123",
		});
		expect(accepted.ok).toBe(false);
	});

	it("un enlace revocado no entra", async () => {
		const email = uniqueEmail("revoked");
		const created = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(created.ok).toBe(true);
		if (!created.ok) return;
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		const { data: live } = await admin
			.from("invitations")
			.select("id")
			.eq("email", email)
			.eq("status", "pending")
			.single();
		const revoked = await revokeInvitation({
			invitationId: live!.id,
			padrinoId: padrino.id,
		});
		expect(revoked.ok).toBe(true);

		const accepted = await acceptInviteToken({
			token: tokenFromUrl(created.url),
			email,
			displayName: "Revocada",
			password: "invitee-password-123",
		});
		expect(accepted.ok).toBe(false);
	});

	it("el segundo uso del mismo enlace no entra", async () => {
		const email = uniqueEmail("seconduse");
		const created = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(created.ok).toBe(true);
		if (!created.ok) return;
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		const first = await acceptInviteToken({
			token: tokenFromUrl(created.url),
			email,
			displayName: "Primera",
			password: "invitee-password-123",
		});
		expect(first.ok).toBe(true);

		const second = await acceptInviteToken({
			token: tokenFromUrl(created.url),
			email,
			displayName: "Segunda",
			password: "other-password-123",
		});
		expect(second.ok).toBe(false);
	});

	it("reenviar invalida el enlace anterior y el nuevo sí entra", async () => {
		const email = uniqueEmail("resend");
		const first = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(first.ok).toBe(true);
		if (!first.ok) return;
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		const { data: live } = await admin
			.from("invitations")
			.select("id")
			.eq("email", email)
			.eq("status", "pending")
			.single();
		const resent = await resendInviteLink({
			invitationId: live!.id,
			padrinoId: padrino.id,
		});
		expect(resent.ok).toBe(true);
		if (!resent.ok) return;

		const oldAccept = await acceptInviteToken({
			token: tokenFromUrl(first.url),
			email,
			displayName: "Viejo",
			password: "invitee-password-123",
		});
		expect(oldAccept.ok).toBe(false);

		const newAccept = await acceptInviteToken({
			token: tokenFromUrl(resent.url),
			email,
			displayName: "Nueva",
			password: "invitee-password-123",
		});
		expect(newAccept.ok).toBe(true);
	});

	it("no hay dos invitaciones vivas para el mismo email", async () => {
		const email = uniqueEmail("dup");
		const first = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(first.ok).toBe(true);
		if (!first.ok) return;
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		const second = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(second.ok).toBe(false);
		expect("code" in second && second.code).toBe("already_invited_pending");
	});

	it("quien está invitada no puede invitar", async () => {
		const email = uniqueEmail("notyet");
		const created = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(created.ok).toBe(true);
		if (!created.ok) return;
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		const result = await createInviteLink({
			email: uniqueEmail("victim"),
			padrinoId: user!.id,
		});
		expect(result.ok).toBe(false);
		expect("code" in result && result.code).toBe("not_active_member");
	});

	it("quien se dio de baja no reingresa con el enlace", async () => {
		const email = uniqueEmail("left");
		const created = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(created.ok).toBe(true);
		if (!created.ok) return;
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		await admin
			.from("members")
			.update({ status: "left" satisfies MemberRow["status"] })
			.eq("id", user!.id);

		const accepted = await acceptInviteToken({
			token: tokenFromUrl(created.url),
			email,
			displayName: "Ex",
			password: "invitee-password-123",
		});
		expect(accepted.ok).toBe(false);
	});

	it("el padrino puede copiar después el mismo enlace vivo y canjearlo", async () => {
		const email = uniqueEmail("copy");
		const created = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(created.ok).toBe(true);
		if (!created.ok) return;
		const user = await findUserByEmail(email);
		expect(user).not.toBeNull();
		usersToClean.push(user!.id);

		const { data: row } = await admin
			.from("invitations")
			.select("id, email, created_at, expires_at")
			.eq("email", email)
			.eq("status", "pending")
			.single();
		expect(row).not.toBeNull();
		const copied = await inviteLinkFor(row!);
		const accepted = await acceptInviteToken({
			token: tokenFromUrl(copied),
			email,
			displayName: "Copia",
			password: "invitee-password-123",
		});
		expect(accepted.ok).toBe(true);
	});

	it("no se invita a quien ya es Miembro activo", async () => {
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

		const result = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(result.ok).toBe(false);
		expect("code" in result && result.code).toBe("already_member");
	});

	it("no se invita a quien se dio de baja", async () => {
		const email = uniqueEmail("baja");
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

		const result = await createInviteLink({
			email,
			padrinoId: padrino.id,
		});
		expect(result.ok).toBe(false);
		expect("code" in result && result.code).toBe("left_member");
	});

	it("las pendientes viejas sin enlace nuevo no se pueden canjear", async () => {
		const email = uniqueEmail("legacy");
		const { error } = await admin.from("invitations").insert({
			email,
			invited_by: padrino.id,
			status: "pending",
			expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
		});
		expect(error).toBeNull();

		const accepted = await acceptInviteToken({
			token: "not-a-real-link",
			email,
			displayName: "Legacy",
			password: "invitee-password-123",
		});
		expect(accepted.ok).toBe(false);
	});
});
