import { expect, type Page, test } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "andresparra.nojau@gmail.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "cafe1234";
const OBSERVER_EMAIL = process.env.E2E_EMAIL2 ?? "edwarsanz.nojau@gmail.com";
const OBSERVER_PASSWORD = process.env.E2E_PASSWORD2 ?? PASSWORD;

async function signIn(page: Page, email: string, password: string) {
	await page.goto("/auth/login");
	await page.getByRole("textbox", { name: "Email" }).fill(email);
	await page.getByRole("textbox", { name: "Contraseña" }).fill(password);
	await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

test("el observador ve el avance de Etapa sin recargar", async ({
	browser,
}) => {
	test.setTimeout(90_000);

	const moderator = await browser.newContext();
	const observer = await browser.newContext();
	const modPage = await moderator.newPage();
	const obsPage = await observer.newPage();

	await signIn(modPage, EMAIL, PASSWORD);
	await modPage
		.getByRole("button", { name: /nueva sesión|crear la primera sesión/i })
		.click();
	const label = `e2e obs ${Date.now()}`;
	await modPage.getByLabel("Etiqueta").fill(label);
	await modPage.getByRole("button", { name: "Crear" }).click();
	await expect(modPage).toHaveURL(/\/materials\/sessions\/[^/]+\/room$/);
	const roomUrl = modPage.url();

	await signIn(obsPage, OBSERVER_EMAIL, OBSERVER_PASSWORD);
	const invalidLogin = obsPage
		.getByRole("alert")
		.filter({ hasText: /incorrectos/i });
	try {
		await obsPage.waitForURL((url) => url.pathname === "/", {
			timeout: 15_000,
		});
	} catch {
		if (await invalidLogin.isVisible().catch(() => false)) {
			test.skip(true, "second member login unavailable in this env");
		}
		throw new Error("observer login did not reach home");
	}
	await obsPage.goto(roomUrl);
	await expect(obsPage.getByRole("heading", { name: label })).toBeVisible();
	await expect(
		obsPage.getByRole("navigation", { name: "Etapas de la Sala" }),
	).toBeVisible();

	await modPage
		.getByRole("textbox", {
			name: "¿Qué pregunta quieres hacer sobre el material?",
		})
		.fill("¿Qué te dejó esta tertulia?");
	await modPage.getByRole("button", { name: "Enviar pregunta" }).click();
	await expect(modPage.getByText("1 pregunta enviada")).toBeVisible();

	await modPage.getByRole("button", { name: "Continuar a Presentes" }).click();
	await expect(
		modPage.getByRole("heading", { name: "Presentes" }),
	).toBeVisible();
	await expect(obsPage.getByRole("heading", { name: "Presentes" })).toBeVisible(
		{ timeout: 15_000 },
	);

	await moderator.close();
	await observer.close();
});
