import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	advanceToDraw,
	saveQuestion,
	toggleOutsideDrawQuestion,
} from "@/app/materials/_lib/room-actions";
import * as serverClient from "@/lib/supabase/server";

// El seam bajo prueba es room-actions: autenticación + mutación +
// revalidación de la Sala. Supabase se mockea en el borde.
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

const sessionId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const materialId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const groupId = "22222222-2222-2222-2222-222222222222";
const userId = "44444444-4444-4444-4444-444444444444";
const roomPath = `/materials/sessions/${sessionId}/room`;

type TableHandler = Record<
	string,
	{
		select?: unknown;
		insert?: unknown;
		update?: unknown;
	}
>;

function mockSupabase(
	userIdOrNull: string | null,
	tables: TableHandler = {},
	opts: {
		roomStage?: string;
		drawRow?: { id: string } | null;
		rpc?: (fn: string) => Promise<{ error: { message: string } | null }>;
	} = {},
) {
	const getUser = vi.fn().mockResolvedValue({
		data: { user: userIdOrNull ? { id: userIdOrNull } : null },
		error: null,
	});
	const rpc = vi.fn().mockImplementation(async (fn: string) => {
		if (opts.rpc) return opts.rpc(fn);
		return { error: null };
	});
	const from = vi.fn().mockImplementation((table: string) => {
		if (table === "sessions") {
			return {
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						maybeSingle: vi.fn().mockResolvedValue({
							data: {
								material_id: materialId,
								group_id: groupId,
								room_stage: opts.roomStage ?? "presence",
							},
							error: null,
						}),
					}),
				}),
			};
		}
		if (table === "draws") {
			return {
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						maybeSingle: vi.fn().mockResolvedValue({
							data: opts.drawRow ?? null,
							error: null,
						}),
					}),
				}),
			};
		}
		const handler = tables[table];
		if (!handler) return { select: vi.fn() };
		return {
			insert: vi.fn().mockReturnValue(handler.insert),
			update: vi
				.fn()
				.mockReturnValue({ eq: vi.fn().mockResolvedValue(handler.update) }),
			select: vi.fn().mockReturnValue(handler.select),
		};
	});
	vi.mocked(serverClient.createClient).mockResolvedValue({
		auth: { getUser },
		from,
		rpc,
	} as never);
	return { from, rpc };
}

describe("saveQuestion", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("deriva el Material de la Sesión y revalida la Sala", async () => {
		const { from } = mockSupabase(userId, {
			questions: { insert: { error: null } },
		});

		const result = await saveQuestion(sessionId, "¿Qué te hizo pensar?");

		expect(result).toEqual({ ok: true });
		expect(from).toHaveBeenCalledWith("questions");
		expect(revalidatePath).toHaveBeenCalledWith(roomPath);
	});

	it("rechaza sin sesión", async () => {
		mockSupabase(null);

		const result = await saveQuestion(sessionId, "Hola");

		expect(result).toEqual({ ok: false, error: "Debes iniciar sesión." });
	});

	it("rechaza texto vacío", async () => {
		mockSupabase(userId);

		const result = await saveQuestion(sessionId, "   ");

		expect(result).toEqual({
			ok: false,
			error: "La pregunta no puede estar vacía.",
		});
	});
});

describe("toggleOutsideDrawQuestion", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("marca Fuera de sorteo y revalida la Sala", async () => {
		mockSupabase(userId, {
			questions: { update: { error: null, count: 1 } },
		});

		const result = await toggleOutsideDrawQuestion(sessionId, "q1", true);

		expect(result).toEqual({ ok: true });
		expect(revalidatePath).toHaveBeenCalledWith(roomPath);
	});

	it("rechaza sin sesión", async () => {
		mockSupabase(null);

		const result = await toggleOutsideDrawQuestion(sessionId, "q1", true);

		expect(result).toEqual({ ok: false, error: "Debes iniciar sesión." });
	});

	it("explica cuando nadie puede marcar (RLS del moderador)", async () => {
		mockSupabase(userId, {
			questions: { update: { error: null, count: 0 } },
		});

		const result = await toggleOutsideDrawQuestion(sessionId, "q1", true);

		expect(result).toEqual({
			ok: false,
			error:
				"No se pudo marcar la pregunta. Solo el moderador de la Sesión puede hacerlo.",
		});
	});
});

describe("advanceToDraw", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("avanza a Sorteo y sortea al entrar sin sorteo previo", async () => {
		const { rpc } = mockSupabase(userId);

		const result = await advanceToDraw(sessionId);

		expect(result).toEqual({ ok: true });
		expect(rpc).toHaveBeenNthCalledWith(1, "advance_room_stage", {
			target_session_id: sessionId,
			new_stage: "draw",
		});
		expect(rpc).toHaveBeenNthCalledWith(2, "execute_draw", {
			target_session_id: sessionId,
		});
		expect(revalidatePath).toHaveBeenCalledWith(roomPath);
	});

	it("no re-sortea si el Sorteo ya se ejecutó", async () => {
		const { rpc } = mockSupabase(userId, {}, { drawRow: { id: "d1" } });

		const result = await advanceToDraw(sessionId);

		expect(result).toEqual({ ok: true });
		expect(rpc).toHaveBeenCalledTimes(1);
		expect(rpc).toHaveBeenCalledWith("advance_room_stage", {
			target_session_id: sessionId,
			new_stage: "draw",
		});
	});

	it("reintenta el Sorteo si la etapa ya es Sorteo sin sorteo", async () => {
		const { rpc } = mockSupabase(userId, {}, { roomStage: "draw" });

		const result = await advanceToDraw(sessionId);

		expect(result).toEqual({ ok: true });
		expect(rpc).toHaveBeenCalledTimes(1);
		expect(rpc).toHaveBeenCalledWith("execute_draw", {
			target_session_id: sessionId,
		});
	});

	it("propaga el fallo del Sorteo tras avanzar (fallback honesto)", async () => {
		mockSupabase(
			userId,
			{},
			{
				rpc: async (fn) =>
					fn === "execute_draw"
						? { error: { message: "Faltan preguntas" } }
						: { error: null },
			},
		);

		const result = await advanceToDraw(sessionId);

		expect(result).toEqual({ ok: false, error: "Faltan preguntas" });
	});
});
