import { describe, expect, it } from "vitest";
import { registerSchema } from "@/app/auth/register/_schemas/register-schema";
import { memberRedirect } from "@/lib/auth/redirect";

/**
 * Registro abierto + Invitación vincula (#78, ADR-0014).
 * Comportamiento externo: cualquiera crea su cuenta (email + contraseña +
 * nombre visible), el retorno `next` sobrevive por login/registro, y un
 * Miembro no activo nunca entra por padrinazgo.
 */
describe("registro abierto", () => {
	it("acepta email + contraseña + nombre visible", () => {
		const result = registerSchema.safeParse({
			email: "nueva@test.local",
			displayName: "Nueva Miembra",
			password: "secreta-123",
			confirmPassword: "secreta-123",
		});
		expect(result.success).toBe(true);
	});

	it("rechaza contraseñas que no coinciden", () => {
		const result = registerSchema.safeParse({
			email: "nueva@test.local",
			displayName: "Nueva Miembra",
			password: "secreta-123",
			confirmPassword: "otra-123",
		});
		expect(result.success).toBe(false);
	});
});

describe("retorno next", () => {
	it("preserva el canje /g/unirse?token=…", () => {
		expect(memberRedirect("/g/unirse?token=abc")).toBe("/g/unirse?token=abc");
	});

	it("rechaza URLs externas o sin barra", () => {
		expect(memberRedirect("https://evil.test/x")).toBe("/");
		expect(memberRedirect("//evil.test/x")).toBe("/");
		expect(memberRedirect("")).toBe("/");
		expect(memberRedirect(undefined)).toBe("/");
	});
});

describe("puerta de Miembro no activo", () => {
	it("baja va a login con aviso, invitado va a registro", () => {
		expect(memberRedirect("/g", "left")).toBe("/auth/login?error=left");
		expect(memberRedirect("/g", "invited")).toBe("/auth/register");
	});

	it("activo no redirige", () => {
		expect(memberRedirect("/g", "active")).toBe("/g");
	});
});
