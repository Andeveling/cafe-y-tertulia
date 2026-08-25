import { expect, test } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "andresparra.nojau@gmail.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "cafe1234";

test("crea una sesión, entra a la Sala y la cierra", async ({ page }) => {
	test.setTimeout(90_000);

	await page.goto("/auth/login");
	await page.getByRole("textbox", { name: "Email" }).fill(EMAIL);
	await page.getByRole("textbox", { name: "Contraseña" }).fill(PASSWORD);
	await page.getByRole("button", { name: "Iniciar sesión" }).click();
	await expect(page.getByRole("heading", { name: "Sesiones" })).toBeVisible();

	const label = `e2e ${Date.now()}`;
	await page.getByLabel("Etiqueta").fill(label);
	await page.getByRole("button", { name: "Crear" }).click();

	await expect(page).toHaveURL(/\/materials\/sessions\/[^/]+\/room$/);
	await expect(page.getByRole("heading", { name: label })).toBeVisible();

	const question = page.getByRole("textbox", {
		name: "¿Qué pregunta quieres hacer sobre el material?",
	});
	await question.fill("¿Qué te dejó esta tertulia?");
	await page.getByRole("button", { name: "Enviar pregunta" }).click();
	await expect(page.getByText("1 pregunta enviada")).toBeVisible();

	await page.getByRole("button", { name: "Ir a Presentes →" }).click();
	await page.getByRole("button", { name: "Estoy presente" }).click();
	await expect(page.getByText("1/1")).toBeVisible();
	await page.getByRole("button", { name: "Ir a Sorteo →" }).click();
	await expect(
		page.getByRole("button", { name: "Ir a Debate →" }),
	).toBeVisible();

	await page.getByRole("button", { name: "Ir a Debate →" }).click();
	await page.getByRole("button", { name: "Ir a Cierre →" }).click();

	await page.getByRole("button", { name: "Cerrar sesión" }).click();
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Cerrar sesión" })
		.click();

	await expect(
		page.getByRole("heading", { name: "Sesión finalizada" }),
	).toBeVisible();
});
