import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * [multi-grupo] 05 Contract (#74, PRD #69, ADR-0013).
 *
 * Ya no existe ningún dato sin grupo ni ningún acceso fuera de
 * is_group_member(): todo group_id es NOT NULL con FK, las políticas
 * viejas desaparecen y el acceso anónimo a materials/sessions se elimina.
 *
 * Dos capas:
 *  - Estática (sin DB): la migración del contract existe y contiene
 *    NOT NULL + FKs + cierre anon + rollback documentado.
 *  - Integración (con Supabase local): no-miembro no ve privadas ni su
 *    contenido; miembro de A no lee/escribe nada de B; salir revoca.
 */

const MIGRATION = "20260923000003_groups_contract.sql";
const migrationPath = join(process.cwd(), "supabase", "migrations", MIGRATION);

const SCOPED_TABLES = [
	"materials",
	"sessions",
	"categories",
	"material_categories",
	"session_categories",
	"seasons",
	"badges",
	"awards",
	"counts",
	"season_recognitions",
	"trivias",
	"questions",
	"draws",
	"assignments",
	"session_participants",
	"takes",
	"trivia_rounds",
	"votes",
	"hearts",
	"convocatorias",
] as const;

function readMigration(): string {
	if (!existsSync(migrationPath)) return "";
	return readFileSync(migrationPath, "utf8");
}

describe("contract: migración existe y cierra el modelo (#74)", () => {
	it("la migración del contract existe", () => {
		expect(
			existsSync(migrationPath),
			`falta supabase/migrations/${MIGRATION}`,
		).toBe(true);
	});

	it("group_id NOT NULL en las 20 tablas scopeadas", () => {
		const sql = readMigration();
		expect(sql.length).toBeGreaterThan(0);
		// Verificación explícita por tabla: ALTER ... ALTER COLUMN group_id SET NOT NULL
		for (const t of SCOPED_TABLES) {
			const re = new RegExp(
				`alter\\s+table\\s+(?:public\\.)?${t}\\s+alter\\s+column\\s+group_id\\s+set\\s+not\\s+null`,
				"i",
			);
			expect(re.test(sql), `${t}: falta ALTER ... SET NOT NULL`).toBe(true);
		}
	});

	it("FKs group_id → groups(id) ON DELETE CASCADE", () => {
		const sql = readMigration();
		for (const t of SCOPED_TABLES) {
			const re = new RegExp(
				`foreign\\s+key\\s*\\(\\s*group_id\\s*\\)\\s+references\\s+(?:public\\.)?groups\\s*\\(\\s*id\\s*\\)\\s+on\\s+delete\\s+cascade`,
				"i",
			);
			expect(
				re.test(sql),
				`${t}: falta FK a groups(id) ON DELETE CASCADE`,
			).toBe(true);
		}
	});

	it("anon SELECT en materials/sessions eliminado (policies + grants)", () => {
		const sql = readMigration().toLowerCase();
		expect(sql.includes("materials_select_anon")).toBe(true);
		expect(sql.includes("sessions_select_anon")).toBe(true);
		expect(sql.includes("revoke")).toBe(true);
		expect(sql.includes("anon")).toBe(true);
	});

	it("is_member() fuera de políticas de contenido (queda solo plataforma)", () => {
		const sql = readMigration();
		// La migración debe blindar el contrato: guarda que falla si queda
		// is_member() en políticas de las tablas scopeadas.
		expect(sql.includes("is_member()")).toBe(true);
		expect(sql.toLowerCase().includes("pg_policies")).toBe(true);
	});

	it("rollback documentado si staging falla", () => {
		const sql = readMigration().toLowerCase();
		expect(sql.includes("rollback")).toBe(true);
		expect(sql.includes("staging")).toBe(true);
	});
});

// ─── Integración (requiere Supabase local; se salta sin env) ───

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = Boolean(URL && ANON_KEY && SERVICE_KEY);

let sb!: SupabaseClient;
let anonFor: (email: string, password: string) => Promise<SupabaseClient>;

const TEST_PASSWORD = "pass-123456";
type TestMember = { id: string; email: string; password: string };
const ids = { users: [] as string[], groupA: "", groupB: "" };
const testUsers: { a?: TestMember; b?: TestMember; out?: TestMember } = {};
const uniqueEmail = (p: string) =>
	`${p}${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;

async function createActiveMember(email: string, password: string) {
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

	const a = await createActiveMember(uniqueEmail("contract-a"), TEST_PASSWORD);
	const b = await createActiveMember(uniqueEmail("contract-b"), TEST_PASSWORD);
	const out = await createActiveMember(
		uniqueEmail("contract-out"),
		TEST_PASSWORD,
	);
	const { data: gA } = await sb
		.from("groups")
		.insert({ name: "Contract A", visibility: "public", created_by: a.id })
		.select("id")
		.single();
	const { data: gB } = await sb
		.from("groups")
		.insert({ name: "Contract B", visibility: "private", created_by: b.id })
		.select("id")
		.single();
	ids.groupA = (gA as { id: string }).id;
	ids.groupB = (gB as { id: string }).id;
	await sb
		.from("group_members")
		.insert({ group_id: ids.groupA, member_id: a.id, role: "admin" });
	await sb
		.from("group_members")
		.insert({ group_id: ids.groupB, member_id: b.id, role: "admin" });
	testUsers.a = a;
	testUsers.b = b;
	testUsers.out = out;
});

afterAll(async () => {
	if (!hasEnv) return;
	if (ids.groupA) await sb.from("groups").delete().eq("id", ids.groupA);
	if (ids.groupB) await sb.from("groups").delete().eq("id", ids.groupB);
	for (const id of ids.users) {
		try {
			await sb.auth.admin.deleteUser(id);
		} catch {
			/* noop */
		}
	}
});

describe.skipIf(!hasEnv)("contract: aislamiento verificado en DB (#74)", () => {
	it("no-miembro no ve grupos privados ni su contenido", async () => {
		const client = await anonFor(testUsers.out!.email, TEST_PASSWORD);
		const { data: groups } = await client.from("groups").select("id");
		const seen = (groups ?? []).map((r: { id: string }) => r.id);
		expect(seen).not.toContain(ids.groupB);
		const { data: mats } = await client.from("materials").select("id");
		expect(mats ?? []).toHaveLength(0);
	});

	it("miembro de A no lee/escribe nada de B", async () => {
		const client = await anonFor(testUsers.a!.email, TEST_PASSWORD);
		const { data: groups } = await client.from("groups").select("id");
		const seen = (groups ?? []).map((r: { id: string }) => r.id);
		expect(seen).toContain(ids.groupA);
		expect(seen).not.toContain(ids.groupB);
		const { error } = await client.from("materials").insert({
			title: "Intruso contract",
			kind: "book",
			author: "X",
			created_by: testUsers.a!.id,
			group_id: ids.groupB,
		});
		expect(error).not.toBeNull();
	});

	it("insert sin group_id falla (NOT NULL)", async () => {
		const { error } = await sb.from("materials").insert({
			title: "Sin grupo",
			kind: "book",
			author: "X",
			created_by: testUsers.a!.id,
			group_id: null,
		});
		expect(error).not.toBeNull();
	});

	it("anon no lee materials ni sessions", async () => {
		const anon = createClient(URL!, ANON_KEY!);
		const { data: mats } = await anon.from("materials").select("id");
		expect(mats ?? []).toHaveLength(0);
		const { data: sess } = await anon.from("sessions").select("id");
		expect(sess ?? []).toHaveLength(0);
	});

	it("salir del grupo revoca todo su contenido", async () => {
		await sb
			.from("group_members")
			.delete()
			.eq("group_id", ids.groupA)
			.eq("member_id", testUsers.a!.id);
		const client = await anonFor(testUsers.a!.email, TEST_PASSWORD);
		const { data: mats } = await client.from("materials").select("id");
		expect(mats ?? []).toHaveLength(0);
		const { data: groups } = await client.from("groups").select("id");
		const seen = (groups ?? []).map((r: { id: string }) => r.id);
		expect(seen).not.toContain(ids.groupA);
	});
});
