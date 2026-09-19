import { beforeEach, describe, expect, it, vi } from "vitest";
import { setMaterialCategories } from "@/app/materials/_lib/category-actions";
import * as memberRepo from "@/app/materials/_lib/members";
import * as serverClient from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

vi.mock("@/app/materials/_lib/members", () => ({
	isActiveMember: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

const materialId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const userId = "11111111-1111-1111-1111-111111111111";

function mockClient(opts: { active: boolean; knownIds: string[] }) {
	const deleteEq = vi.fn().mockResolvedValue({ error: null });
	const insert = vi.fn().mockResolvedValue({ error: null });
	const from = vi.fn().mockImplementation((table: string) => {
		if (table === "materials") {
			return {
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						maybeSingle: vi
							.fn()
							.mockResolvedValue({ data: { id: materialId }, error: null }),
					}),
				}),
			};
		}
		if (table === "categories") {
			return {
				select: vi.fn().mockResolvedValue({
					data: opts.knownIds.map((id) => ({ id })),
					error: null,
				}),
			};
		}
		return {
			delete: vi.fn().mockReturnValue({ eq: deleteEq }),
			insert,
		};
	});
	vi.mocked(serverClient.createClient).mockResolvedValue({
		auth: {
			getUser: vi
				.fn()
				.mockResolvedValue({ data: { user: { id: userId } }, error: null }),
		},
		from,
	} as never);
	vi.mocked(memberRepo.isActiveMember).mockResolvedValue(opts.active);
	return { from, deleteEq, insert };
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("setMaterialCategories", () => {
	it("rechaza a quien no es miembro activo", async () => {
		mockClient({ active: false, knownIds: ["c1"] });
		const result = await setMaterialCategories(materialId, ["c1"]);
		expect(result.ok).toBe(false);
	});

	it("rechaza ids desconocidos sin tocar el puente", async () => {
		const { from } = mockClient({ active: true, knownIds: ["c1"] });
		const result = await setMaterialCategories(materialId, ["c1", "nope"]);
		expect(result).toEqual({
			ok: false,
			error: "Hay categorías desconocidas.",
		});
		expect(from).toHaveBeenCalledTimes(2);
	});

	it("rechaza un material inexistente", async () => {
		mockClient({ active: true, knownIds: ["c1"] });
		vi.mocked(serverClient.createClient).mockResolvedValue({
			auth: {
				getUser: vi
					.fn()
					.mockResolvedValue({ data: { user: { id: userId } }, error: null }),
			},
			from: vi.fn().mockImplementation((table: string) => {
				if (table === "materials") {
					return {
						select: vi.fn().mockReturnValue({
							eq: vi.fn().mockReturnValue({
								maybeSingle: vi
									.fn()
									.mockResolvedValue({ data: null, error: null }),
							}),
						}),
					};
				}
				return { select: vi.fn() };
			}),
		} as never);
		const result = await setMaterialCategories(materialId, ["c1"]);
		expect(result).toEqual({ ok: false, error: "No se encontró el material." });
	});

	it("reemplaza el puente con los ids válidos", async () => {
		const { deleteEq, insert } = mockClient({
			active: true,
			knownIds: ["c1", "c2"],
		});
		const result = await setMaterialCategories(materialId, ["c1", "c2", "c1"]);
		expect(result).toEqual({ ok: true });
		expect(deleteEq).toHaveBeenCalledWith("material_id", materialId);
		expect(insert).toHaveBeenCalledWith([
			{ material_id: materialId, category_id: "c1" },
			{ material_id: materialId, category_id: "c2" },
		]);
	});
});
