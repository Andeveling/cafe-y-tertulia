import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as memberRepo from "@/app/materials/_lib/members";
import {
	type ActionResult,
	createQuestionAction,
	toggleOutsideDrawAction,
} from "@/app/materials/_lib/question-actions";
import {
	createQuestion,
	toggleOutsideDraw,
} from "@/app/materials/_lib/questions";
import * as serverClient from "@/lib/supabase/server";

// La autenticación vive en la capa de acciones; el DAL es un colaborador
// externo (Supabase) mockeado en el borde del sistema.
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("@/app/materials/_lib/members", () => ({
	isActiveMember: vi.fn(),
}));

vi.mock("@/app/materials/_lib/questions", () => ({
	createQuestion: vi.fn(),
	toggleOutsideDraw: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

const sessionId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const materialId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const prevState: ActionResult = { ok: true };

function mockAuth(userId: string | null) {
	const getUser = vi.fn().mockResolvedValue({
		data: { user: userId ? { id: userId } : null },
		error: null,
	});
	const byId = (row: unknown) =>
		vi.fn().mockReturnValue({
			eq: vi.fn().mockReturnValue({
				maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
			}),
		});
	const from = vi.fn().mockImplementation((table: string) => {
		if (table === "sessions") {
			return { select: byId({ material_id: materialId }) };
		}
		if (table === "questions") {
			return { select: byId({ material_id: materialId }) };
		}
		return { select: vi.fn() };
	});
	vi.mocked(serverClient.createClient).mockResolvedValue({
		auth: { getUser },
		from,
	} as never);
	return getUser;
}

function mockFormData(entries: Record<string, string>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(entries)) {
		fd.set(key, value);
	}
	return fd;
}

describe("createQuestionAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("rechaza sin sesión", async () => {
		mockAuth(null);

		const result = await createQuestionAction(prevState, mockFormData({}));

		expect(result).toEqual({
			ok: false,
			error: "Debes iniciar sesión para aportar una pregunta.",
		});
		expect(createQuestion).not.toHaveBeenCalled();
	});

	it("rechaza a un no-Miembro activo", async () => {
		mockAuth("44444444-4444-4444-4444-444444444444");
		vi.mocked(memberRepo.isActiveMember).mockResolvedValue(false);

		const result = await createQuestionAction(prevState, mockFormData({}));

		expect(result).toEqual({
			ok: false,
			error: "Solo los Miembros del club pueden aportar preguntas.",
		});
		expect(createQuestion).not.toHaveBeenCalled();
	});

	it("rechaza texto vacío", async () => {
		mockAuth("11111111-1111-1111-1111-111111111111");
		vi.mocked(memberRepo.isActiveMember).mockResolvedValue(true);
		const fd = mockFormData({});
		fd.set("session_id", sessionId);
		fd.set("material_id", materialId);
		fd.set("text", "   ");

		const result = await createQuestionAction(prevState, fd);

		expect(result).toEqual({
			ok: false,
			error: "La pregunta no puede estar vacía.",
		});
		expect(createQuestion).not.toHaveBeenCalled();
	});

	it("crea la Pregunta y revalida la página del material", async () => {
		mockAuth("11111111-1111-1111-1111-111111111111");
		vi.mocked(memberRepo.isActiveMember).mockResolvedValue(true);
		vi.mocked(createQuestion).mockResolvedValue({} as never);
		const fd = mockFormData({});
		fd.set("session_id", sessionId);
		fd.set("material_id", materialId);
		fd.set("text", "¿Qué opinas del capítulo 2?");

		const result = await createQuestionAction(prevState, fd);

		expect(result).toEqual({ ok: true });
		expect(createQuestion).toHaveBeenCalledWith(expect.anything(), {
			sessionId,
			materialId,
			authorId: "11111111-1111-1111-1111-111111111111",
			text: "¿Qué opinas del capítulo 2?",
		});
		expect(revalidatePath).toHaveBeenCalledWith(`/materiales/${materialId}`);
	});
});

describe("toggleOutsideDrawAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("rechaza sin sesión", async () => {
		mockAuth(null);

		const result = await toggleOutsideDrawAction(prevState, mockFormData({}));

		expect(result).toEqual({ ok: false, error: "Debes iniciar sesión." });
		expect(toggleOutsideDraw).not.toHaveBeenCalled();
	});

	it("rechaza a un no-Miembro activo", async () => {
		mockAuth("44444444-4444-4444-4444-444444444444");
		vi.mocked(memberRepo.isActiveMember).mockResolvedValue(false);
		const fd = mockFormData({});
		fd.set("question_id", "q1");
		fd.set("outside_draw", "true");

		const result = await toggleOutsideDrawAction(prevState, fd);

		expect(result).toEqual({
			ok: false,
			error: "Solo los Miembros del club pueden modificar preguntas.",
		});
		expect(toggleOutsideDraw).not.toHaveBeenCalled();
	});

	it("marca/desmarca 'Fuera de sorteo' y revalida", async () => {
		mockAuth("22222222-2222-2222-2222-222222222222");
		vi.mocked(memberRepo.isActiveMember).mockResolvedValue(true);
		vi.mocked(toggleOutsideDraw).mockResolvedValue(undefined);
		const fd = mockFormData({});
		fd.set("question_id", "q1");
		fd.set("material_id", materialId);
		fd.set("outside_draw", "true");

		const result = await toggleOutsideDrawAction(prevState, fd);

		expect(result).toEqual({ ok: true });
		expect(toggleOutsideDraw).toHaveBeenCalledWith(
			expect.anything(),
			"q1",
			true,
		);
		expect(revalidatePath).toHaveBeenCalledWith(`/materiales/${materialId}`);
	});
});
