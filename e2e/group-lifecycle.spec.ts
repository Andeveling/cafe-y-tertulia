import { expect, type Page, test } from "@playwright/test";

/**
 * Ciclo completo crear → invitar → sesión → salir (PRD #69, issue #76).
 * Patrón e2e/session-lifecycle.spec.ts. Requiere Supabase + dos miembros:
 * E2E_EMAIL/E2E_PASSWORD (admin) y E2E_EMAIL_2/E2E_PASSWORD_2 (invitado).
 */

const EMAIL = process.env.E2E_EMAIL ?? "andresparra.nojau@gmail.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "cafe1234";
const EMAIL_2 = process.env.E2E_EMAIL_2 ?? "";
const PASSWORD_2 = process.env.E2E_PASSWORD_2 ?? "";

async function signIn(page: Page, email: string, password: string) {
	await page.goto("/auth/login");
	await page.getByRole("textbox", { name: "Email" }).fill(email);
	await page.getByRole("textbox", { name: "Contraseña" }).fill(password);
	await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

async function createGroup(
	page: Page,
	name: string,
	visibility: "public" | "private",
) {
	await page.goto("/g");
	await page.getByRole("button", { name: /crear grupo/i }).click();
	await page.getByLabel("Nombre").fill(name);
	if (visibility === "public") {
		await page.getByLabel("Visibilidad").selectOption("public");
	}
	await page.getByRole("button", { name: "Crear", exact: true }).click();
	await expect(page.getByText(name).first()).toBeVisible();
}

test("grupo público: crear → descubrir → unirse → salir revoca", async ({
	page,
	browser,
}) => {
	test.skip(!EMAIL_2 || !PASSWORD_2, "Falta segundo miembro E2E");
	test.setTimeout(120_000);

	const name = `e2e-publico-${Date.now()}`;

	// Admin crea el grupo público y lo ve en Mis Grupos.
	await signIn(page, EMAIL, PASSWORD);
	await createGroup(page, name, "public");

	// Segundo miembro (contexto aislado) lo descubre y se une.
	const ctx2 = await browser.newContext();
	const page2 = await ctx2.newPage();
	await signIn(page2, EMAIL_2, PASSWORD_2);
	await page2.goto("/g");
	await expect(
		page2.getByRole("heading", { name: /catálogo público/i }),
	).toBeVisible();
	await page2
		.locator("li", { hasText: name })
		.first()
		.getByRole("button", { name: "Unirse" })
		.click();
	await expect(page2.getByText(name).first()).toBeVisible();

	// Entra al grupo: ve el roster con su identidad.
	await page2.getByText(name).first().click();
	await expect(page2).toHaveURL(/\/g\/.+/);
	await expect(page2.getByRole("heading", { name: /miembros/i })).toBeVisible();

	// Salir revoca el acceso: vuelve a /g sin el grupo.
	await page2.getByRole("button", { name: /salir del grupo/i }).click();
	await expect(page2).toHaveURL(/\/g$/);
	await expect(page2.locator("li", { hasText: name })).toHaveCount(0);
	await ctx2.close();
});

test("grupo privado: invitación por enlace une", async ({ page, browser }) => {
	test.skip(!EMAIL_2 || !PASSWORD_2, "Falta segundo miembro E2E");
	test.setTimeout(120_000);

	const name = `e2e-privado-${Date.now()}`;

	// Admin crea el grupo privado.
	await signIn(page, EMAIL, PASSWORD);
	await createGroup(page, name, "private");

	// El privado no aparece en el catálogo del segundo miembro.
	const ctx2 = await browser.newContext();
	const page2 = await ctx2.newPage();
	await signIn(page2, EMAIL_2, PASSWORD_2);
	await page2.goto("/g");
	await expect(page2.locator("li", { hasText: name })).toHaveCount(0);

	// Admin genera el enlace en ajustes y el invitado lo canjea.
	await page.getByText(name).first().click();
	await page.getByRole("link", { name: /ajustes/i }).click();
	await page.getByRole("button", { name: /generar enlace/i }).click();
	const link = page.locator("text=/\\/g\\/unirse\\?token=/").first();
	await expect(link).toBeVisible();
	const url = (await link.textContent())?.trim() ?? "";
	expect(url).toContain("/g/unirse?token=");

	await page2.goto(url);
	await expect(page2).toHaveURL(/\/g\/.+/);
	await expect(page2.getByText(name).first()).toBeVisible();
	await ctx2.close();
});
