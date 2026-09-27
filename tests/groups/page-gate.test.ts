import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentMember } from "@/lib/current-member";
import {
	requireActiveMemberPage,
	requireGroupPage,
} from "@/lib/groups/page-gate";
import { getGroupBySlug } from "@/lib/groups/queries";

// El seam bajo prueba es el gate de páginas del Grupo: membresía + grupo
// resueltos una sola vez, con redirect/notFound del layout y las páginas.
vi.mock("@/lib/current-member", () => ({
	getCurrentMember: vi.fn(),
}));

vi.mock("@/lib/groups/queries", () => ({
	getGroupBySlug: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		throw new Error(`NEXT_REDIRECT ${url}`);
	},
	notFound: () => {
		throw new Error("NEXT_NOT_FOUND");
	},
}));

const supabase = { from: vi.fn() } as never;
const member = { id: "m-1", status: "active" } as never;
const group = {
	id: "g-1",
	slug: "nojau",
	name: "Nojau",
	description: null,
	avatar: null,
	visibility: "private",
	role: "admin",
} as {
	id: string;
	slug: string;
	name: string;
	description: null;
	avatar: null;
	visibility: "private";
	role: "admin" | null;
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getCurrentMember).mockResolvedValue({ supabase, member });
	vi.mocked(getGroupBySlug).mockResolvedValue(group);
});

describe("requireGroupPage", () => {
	it("resuelve miembro y grupo una sola vez", async () => {
		const result = await requireGroupPage("nojau");

		expect(result).toEqual({ supabase, member, group });
		expect(getCurrentMember).toHaveBeenCalledTimes(1);
		expect(getGroupBySlug).toHaveBeenCalledWith(supabase, "nojau", "m-1");
	});

	it("sin sesión va a login", async () => {
		vi.mocked(getCurrentMember).mockResolvedValue({
			supabase,
			member: null,
		});

		await expect(requireGroupPage("nojau")).rejects.toThrow(
			"NEXT_REDIRECT /auth/login",
		);
		expect(getGroupBySlug).not.toHaveBeenCalled();
	});

	it("miembro no activo va a su destino", async () => {
		vi.mocked(getCurrentMember).mockResolvedValue({
			supabase,
			member: { id: "m-1", status: "left" } as never,
		});

		await expect(requireGroupPage("nojau")).rejects.toThrow(
			"NEXT_REDIRECT /auth/login?error=left",
		);
	});

	it("grupo ajeno es notFound", async () => {
		vi.mocked(getGroupBySlug).mockResolvedValue({
			...group,
			role: null,
		} as never);

		await expect(requireGroupPage("otro")).rejects.toThrow("NEXT_NOT_FOUND");
	});

	it("sesiones redirige a Mis Grupos en grupo ajeno", async () => {
		vi.mocked(getGroupBySlug).mockResolvedValue(null);

		await expect(
			requireGroupPage("otro", { onMissing: "mis-grupos" }),
		).rejects.toThrow("NEXT_REDIRECT /g");
	});
});

describe("requireActiveMemberPage", () => {
	it("resuelve miembro y cliente una sola vez", async () => {
		const result = await requireActiveMemberPage();

		expect(result).toEqual({ supabase, member });
	});

	it("sin sesión va a login y con baja avisa", async () => {
		vi.mocked(getCurrentMember).mockResolvedValue({
			supabase,
			member: null,
		});
		await expect(requireActiveMemberPage()).rejects.toThrow(
			"NEXT_REDIRECT /auth/login",
		);

		vi.mocked(getCurrentMember).mockResolvedValue({
			supabase,
			member: { id: "m-1", status: "left" } as never,
		});
		await expect(requireActiveMemberPage()).rejects.toThrow(
			"NEXT_REDIRECT /auth/login?error=left",
		);
	});
});
