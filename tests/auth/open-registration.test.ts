import { describe, expect, it } from "vitest";
import { registerSchema } from "@/app/auth/register/_schemas/register-schema";
import {
	inactiveMemberDestination,
	memberRedirect,
	withNext,
} from "@/lib/auth/redirect";

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

describe("destino de Miembro inactivo", () => {
	it("activo entra, baja va a login con aviso, resto va a registro", () => {
		expect(inactiveMemberDestination("active")).toBeNull();
		expect(inactiveMemberDestination("left")).toBe("/auth/login?error=left");
		expect(inactiveMemberDestination("invited")).toBe("/auth/register");
		expect(inactiveMemberDestination(null)).toBe("/auth/register");
		expect(inactiveMemberDestination(undefined)).toBe("/auth/register");
	});
});

describe("retorno withNext", () => {
	it("omite el parámetro en la raíz para URLs canónicas", () => {
		expect(withNext("/auth/register", "/")).toBe("/auth/register");
		expect(withNext("/auth/register", undefined)).toBe("/auth/register");
	});

	it("preserva el destino interno", () => {
		expect(withNext("/auth/register", "/g/unirse?token=abc")).toBe(
			"/auth/register?next=%2Fg%2Funirse%3Ftoken%3Dabc",
		);
	});

	it("agrega con & cuando ya hay query", () => {
		expect(withNext("/auth/login?error=invalid", "/g")).toBe(
			"/auth/login?error=invalid&next=%2Fg",
		);
	});

	it("nunca apunta afuera", () => {
		expect(withNext("/auth/login", "https://evil.test/x")).toBe("/auth/login");
	});
});
