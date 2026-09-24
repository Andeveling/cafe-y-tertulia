import { beforeEach, describe, expect, it, vi } from "vitest";
import { listCategories } from "@/app/materials/_lib/categories";

vi.mock("server-only", () => ({}));

const GROUP_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function mockSupabase(rows: { id: string; key: string; name: string; icon: string }[]) {
	const order = vi.fn().mockReturnValue({ data: rows, error: null });
	const eq = vi.fn().mockReturnValue({ order });
	const builder = { eq, order };
	const select = vi.fn().mockReturnValue(builder);
	const from = vi.fn().mockReturnValue({ select });
	return { from, select, eq, order };
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("listCategories", () => {
	it("filters by groupId when provided", async () => {
		const supabase = mockSupabase([
			{ id: "c1", key: "filosofia", name: "Filosofía", icon: "Idea01Icon" },
			{ id: "c2", key: "cine", name: "Cine", icon: "ClapperboardIcon" },
		]);

		const result = await listCategories(
			supabase as never,
			GROUP_A,
		);

		expect(result).toHaveLength(2);
		expect(result.map((c) => c.name).sort()).toEqual(["Cine", "Filosofía"]);
		expect(supabase.eq).toHaveBeenCalledWith("group_id", GROUP_A);
	});

	it("returns all categories when groupId is omitted", async () => {
		const supabase = mockSupabase([
			{ id: "c1", key: "filosofia", name: "Filosofía", icon: "Idea01Icon" },
		]);

		const result = await listCategories(supabase as never);

		expect(result).toHaveLength(1);
		expect(supabase.eq).not.toHaveBeenCalled();
	});
});