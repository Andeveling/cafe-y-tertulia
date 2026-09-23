import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * [multi-grupo] 03 Migrate RLS lote A (#72, PRD #69).
 *
 * Aislamiento del contenido core (materials, sessions, categories, seasons,
 * convocatorias) por grupo: miembro de A no lee ni escribe nada de B,
 * quien no es miembro no ve nada y salir revoca el acceso.
 *
 * Patrón tests/membership.test.ts: service-role para preparar y afirmar,
 * cliente autenticado para verificar las políticas.
 *
 * Requiere Supabase local (`supabase start` + `.env.local`). Sin env, el
 * archivo se salta para no romper `vitest run` fuera de integración.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = Boolean(URL && ANON_KEY && SERVICE_KEY);

// Cliente sin tipos generados: database.types.ts aún no incluye groups ni
// group_id (se regenera con la migración aplicada); el test usa strings.
let sb!: SupabaseClient;
let anonFor: (email: string, password: string) => Promise<SupabaseClient>;

const TEST_PASSWORD = "pass-123456";

type TestMember = { id: string; email: string; password: string };

const ids = {
	users: [] as string[],
	groupA: "",
	groupB: "",
	matA: "",
	matB: "",
};

const testUsers: {
	a?: TestMember;
	b?: TestMember;
	out?: TestMember;
} = {};

const uniqueEmail = (prefix: string) =>
	`${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;

async function createActiveMember(
	email: string,
	password: string,
): Promise<TestMember> {
	const { data, error } = await sb.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
	});
	if (error) throw error;
	ids.users.push(data.user.id);
	const { error: mErr } = await sb
		.from("members")
		.insert({ id: data.user.id, status: "active", display_name: email });
	if (mErr) throw mErr;
	return { id: data.user.id, email, password };
}

beforeAll(async () => {
	if (!hasEnv) return;
	sb = createClient(URL!, SERVICE_KEY!, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
	anonFor = async (email: string, password: string) => {
		const client = createClient(URL!, ANON_KEY!);
		const { error } = await client.auth.signInWithPassword({
			email,
			password,
		});
		if (error) throw error;
		return client;
	};

	const a = await createActiveMember(uniqueEmail("lotea-a"), TEST_PASSWORD);
	const b = await createActiveMember(uniqueEmail("lotea-b"), TEST_PASSWORD);
	const out = await createActiveMember(uniqueEmail("lotea-out"), TEST_PASSWORD);

	// Dos grupos con un miembro cada uno (setup directo, salta RLS).
	const { data: gA, error: gAErr } = await sb
		.from("groups")
		.insert({ name: "LoteA A", visibility: "public", created_by: a.id })
		.select("id")
		.single();
	if (gAErr) throw gAErr;
	const { data: gB, error: gBErr } = await sb
		.from("groups")
		.insert({ name: "LoteA B", visibility: "private", created_by: b.id })
		.select("id")
		.single();
	if (gBErr) throw gBErr;
	ids.groupA = gA.id;
	ids.groupB = gB.id;

	for (const [g, m, role] of [
		[ids.groupA, a.id, "admin"],
		[ids.groupB, b.id, "admin"],
	] as const) {
		const { error } = await sb
			.from("group_members")
			.insert({ group_id: g, member_id: m, role });
		if (error) throw error;
	}

	const { data: mA, error: mAErr } = await sb
		.from("materials")
		.insert({
			title: "Material solo de A",
			kind: "book",
			author: "Autora",
			created_by: a.id,
			group_id: ids.groupA,
		})
		.select("id")
		.single();
	if (mAErr) throw mAErr;
	const { data: mB, error: mBErr } = await sb
		.from("materials")
		.insert({
			title: "Material solo de B",
			kind: "book",
			author: "Autora",
			created_by: b.id,
			group_id: ids.groupB,
		})
		.select("id")
		.single();
	if (mBErr) throw mBErr;
	ids.matA = mA.id;
	ids.matB = mB.id;

	testUsers.a = a;
	testUsers.b = b;
	testUsers.out = out;
});

afterAll(async () => {
	if (!hasEnv) return;
	await sb.from("materials").delete().eq("id", ids.matA);
	await sb.from("materials").delete().eq("id", ids.matB);
	await sb.from("groups").delete().eq("id", ids.groupA);
	await sb.from("groups").delete().eq("id", ids.groupB);
	for (const id of ids.users) {
		await sb.auth.admin.deleteUser(id);
	}
});

describe.skipIf(!hasEnv)(
	"lote A: contenido core aislado por grupo (#72)",
	() => {
		it("miembro de A lee su material y no el de B", async () => {
			const anon = await anonFor(testUsers.a!.email, TEST_PASSWORD);
			const { data, error } = await anon.from("materials").select("id");
			expect(error).toBeNull();
			const seen = (data ?? []).map((r: { id: string }) => r.id);
			expect(seen).toContain(ids.matA);
			expect(seen).not.toContain(ids.matB);
		});

		it("miembro de A no inserta en B", async () => {
			const anon = await anonFor(testUsers.a!.email, TEST_PASSWORD);
			const { error } = await anon.from("materials").insert({
				title: "Intruso",
				kind: "book",
				author: "X",
				created_by: testUsers.a!.id,
				group_id: ids.groupB,
			});
			expect(error).not.toBeNull();
		});

		it("quien no es miembro no ve ni inserta", async () => {
			const anon = await anonFor(testUsers.out!.email, TEST_PASSWORD);
			const { data, error } = await anon.from("materials").select("id");
			expect(error).toBeNull();
			const seen = (data ?? []).map((r: { id: string }) => r.id);
			expect(seen).not.toContain(ids.matA);
			expect(seen).not.toContain(ids.matB);
			const { error: insErr } = await anon.from("materials").insert({
				title: "Intruso",
				kind: "book",
				author: "X",
				created_by: testUsers.out!.id,
				group_id: ids.groupA,
			});
			expect(insErr).not.toBeNull();
		});

		it("anon no lee materials ni sessions", async () => {
			const client = createClient(URL!, ANON_KEY!);
			const { data: mats } = await client.from("materials").select("id");
			expect(mats ?? []).toHaveLength(0);
			const { data: sess } = await client.from("sessions").select("id");
			expect(sess ?? []).toHaveLength(0);
		});

		it("salir del grupo revoca el contenido", async () => {
			// A sale de su grupo (vía service-role, como haría leave_group).
			await sb
				.from("group_members")
				.delete()
				.eq("group_id", ids.groupA)
				.eq("member_id", testUsers.a!.id);
			const anon = await anonFor(testUsers.a!.email, TEST_PASSWORD);
			const { data } = await anon.from("materials").select("id");
			const seen = (data ?? []).map((r: { id: string }) => r.id);
			expect(seen).not.toContain(ids.matA);
		});
	},
);
