import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * [multi-grupo] 04 Migrate RLS lote B (#73, PRD #69).
 *
 * Sesión viva y gamificación aisladas por grupo: miembro de A no lee ni
 * escribe preguntas, presentes, trivias, takes ni gamificación de B.
 * Salir del grupo revoca el acceso.
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
	sesA: "",
	sesB: "",
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

	const a = await createActiveMember(uniqueEmail("loteb-a"), TEST_PASSWORD);
	const b = await createActiveMember(uniqueEmail("loteb-b"), TEST_PASSWORD);
	const out = await createActiveMember(uniqueEmail("loteb-out"), TEST_PASSWORD);

	const { data: gA, error: gAErr } = await sb
		.from("groups")
		.insert({ name: "LoteB A", visibility: "public", created_by: a.id })
		.select("id")
		.single();
	if (gAErr) throw gAErr;
	const { data: gB, error: gBErr } = await sb
		.from("groups")
		.insert({ name: "LoteB B", visibility: "private", created_by: b.id })
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
			title: "Material LoteB A",
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
			title: "Material LoteB B",
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

	const { data: sA, error: sAErr } = await sb
		.from("sessions")
		.insert({
			material_id: ids.matA,
			range: "Cap. 1",
			status: "lobby",
			moderator_id: a.id,
			group_id: ids.groupA,
		})
		.select("id")
		.single();
	if (sAErr) throw sAErr;
	const { data: sB, error: sBErr } = await sb
		.from("sessions")
		.insert({
			material_id: ids.matB,
			range: "Cap. 1",
			status: "lobby",
			moderator_id: b.id,
			group_id: ids.groupB,
		})
		.select("id")
		.single();
	if (sBErr) throw sBErr;
	ids.sesA = sA.id;
	ids.sesB = sB.id;

	testUsers.a = a;
	testUsers.b = b;
	testUsers.out = out;
});

afterAll(async () => {
	if (!hasEnv) return;
	await sb.from("sessions").delete().eq("id", ids.sesA);
	await sb.from("sessions").delete().eq("id", ids.sesB);
	await sb.from("materials").delete().eq("id", ids.matA);
	await sb.from("materials").delete().eq("id", ids.matB);
	await sb.from("groups").delete().eq("id", ids.groupA);
	await sb.from("groups").delete().eq("id", ids.groupB);
	for (const id of ids.users) {
		await sb.auth.admin.deleteUser(id);
	}
});

describe.skipIf(!hasEnv)(
	"lote B: sesión viva y gamificación aisladas (#73)",
	() => {
		it("miembro de A lee presentes y preguntas de A, no de B", async () => {
			const client = await anonFor(testUsers.a!.email, TEST_PASSWORD);
			const { data: parts, error: pErr } = await client
				.from("session_participants")
				.select("session_id");
			expect(pErr).toBeNull();
			const seenSessions = (parts ?? []).map(
				(r: { session_id: string }) => r.session_id,
			);
			expect(seenSessions).not.toContain(ids.sesB);

			const { data: questions, error: qErr } = await client
				.from("questions")
				.select("id,session_id");
			expect(qErr).toBeNull();
			const qSessions = (questions ?? []).map(
				(r: { session_id: string }) => r.session_id,
			);
			expect(qSessions).not.toContain(ids.sesB);
		});

		it("miembro de A no inserta pregunta ni presencia en B", async () => {
			const client = await anonFor(testUsers.a!.email, TEST_PASSWORD);
			const { error: qErr } = await client.from("questions").insert({
				session_id: ids.sesB,
				material_id: ids.matB,
				group_id: ids.groupB,
				author_id: testUsers.a!.id,
				text: "¿Intrusa?",
			});
			expect(qErr).not.toBeNull();

			const { error: pErr } = await client.from("session_participants").insert({
				session_id: ids.sesB,
				group_id: ids.groupB,
				member_id: testUsers.a!.id,
			});
			expect(pErr).not.toBeNull();
		});

		it("badges y counts solo del propio grupo", async () => {
			const client = await anonFor(testUsers.a!.email, TEST_PASSWORD);
			const { data: badges, error: bErr } = await client
				.from("badges")
				.select("id,group_id");
			expect(bErr).toBeNull();
			for (const b of badges ?? []) {
				expect((b as { group_id: string }).group_id).not.toBe(ids.groupB);
			}
			const { data: counts, error: cErr } = await client
				.from("counts")
				.select("group_id");
			expect(cErr).toBeNull();
			for (const c of counts ?? []) {
				expect((c as { group_id: string }).group_id).not.toBe(ids.groupB);
			}
		});

		it("quien no es miembro no ve preguntas ni trivias", async () => {
			const client = await anonFor(testUsers.out!.email, TEST_PASSWORD);
			const { data: questions } = await client.from("questions").select("id");
			expect(questions ?? []).toHaveLength(0);
			const { data: trivias } = await client.from("trivias").select("id");
			expect(trivias ?? []).toHaveLength(0);
		});

		it("salir del grupo revoca preguntas y presentes", async () => {
			await sb
				.from("group_members")
				.delete()
				.eq("group_id", ids.groupA)
				.eq("member_id", testUsers.a!.id);
			const client = await anonFor(testUsers.a!.email, TEST_PASSWORD);
			const { data: questions } = await client.from("questions").select("id");
			expect(questions ?? []).toHaveLength(0);
			const { data: parts } = await client
				.from("session_participants")
				.select("session_id");
			const seen = (parts ?? []).map(
				(r: { session_id: string }) => r.session_id,
			);
			expect(seen).not.toContain(ids.sesA);
		});
	},
);
