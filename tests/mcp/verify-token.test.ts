import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
	createClient: () => ({ auth: { getUser: getUserMock } }),
}));

// El mock de arriba debe registrarse antes de importar la ruta.
const { verifyToken } = await import("@/app/api/mcp/route");

describe("mcp: verifyToken", () => {
	beforeEach(() => {
		getUserMock.mockReset();
	});

	it("sin token devuelve undefined (withMcpAuth responde 401)", async () => {
		expect(await verifyToken(new Request("http://x/api/mcp"))).toBeUndefined();
		expect(
			await verifyToken(new Request("http://x/api/mcp"), ""),
		).toBeUndefined();
		expect(getUserMock).not.toHaveBeenCalled();
	});

	it("token válido devuelve la identidad del dueño", async () => {
		getUserMock.mockResolvedValue({
			data: { user: { id: "dueña-1" } },
			error: null,
		});
		expect(
			await verifyToken(new Request("http://x/api/mcp"), "jwt-bueno"),
		).toEqual({
			token: "jwt-bueno",
			scopes: [],
			clientId: "dueña-1",
			extra: { userId: "dueña-1" },
		});
		expect(getUserMock).toHaveBeenCalledWith("jwt-bueno");
	});

	it("token inválido devuelve undefined", async () => {
		getUserMock.mockResolvedValue({
			data: { user: null },
			error: { message: "Token expirado" },
		});
		expect(
			await verifyToken(new Request("http://x/api/mcp"), "jwt-malo"),
		).toBeUndefined();
	});

	it("si Supabase falla devuelve undefined, no lanza", async () => {
		getUserMock.mockRejectedValue(new Error("caída de red"));
		expect(
			await verifyToken(new Request("http://x/api/mcp"), "jwt-cualquiera"),
		).toBeUndefined();
	});
});
