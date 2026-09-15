import { expect, type Page, test } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "andresparra.nojau@gmail.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "cafe1234";

async function signIn(page: Page, email = EMAIL, password = PASSWORD) {
	await page.goto("/auth/login");
	await page.getByRole("textbox", { name: "Email" }).fill(email);
	await page.getByRole("textbox", { name: "Contraseña" }).fill(password);
	await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

test("crea una sesión, entra a la Sala y la cierra", async ({ page }) => {
	test.setTimeout(90_000);

	await signIn(page);
	await page
		.getByRole("button", { name: /nueva sesión|crear la primera sesión/i })
		.click();

	const label = `e2e ${Date.now()}`;
	await page.getByLabel("Etiqueta").fill(label);
	await page.getByRole("button", { name: "Crear" }).click();

	await expect(page).toHaveURL(/\/materials\/sessions\/[^/]+\/room$/);
	await expect(page.getByRole("heading", { name: label })).toBeVisible();
	await expect(
		page.getByRole("navigation", { name: "Etapas de la Sala" }),
	).toBeVisible();

	const questionText = "¿Qué te dejó esta tertulia?";
	await page
		.getByRole("textbox", {
			name: "¿Qué pregunta quieres hacer sobre el material?",
		})
		.fill(questionText);
	await page.getByRole("button", { name: "Enviar pregunta" }).click();
	await expect(page.getByText("1 pregunta enviada")).toBeVisible();
	await expect(page.getByText(questionText)).toBeVisible();

	await page.getByRole("button", { name: "Continuar a Presentes" }).click();
	await expect(page.getByRole("heading", { name: "Presentes" })).toBeVisible();

	await page.getByRole("button", { name: "Confirmar asistencia" }).click();
	await expect(page.getByText("1/1 listos")).toBeVisible();

	await page.getByRole("button", { name: "Continuar a Sorteo" }).click();
	await expect(
		page.getByRole("heading", { name: "La rueda está lista" }),
	).toBeVisible();

	await page.getByRole("button", { name: "Sortear" }).click();
	await expect(
		page.getByRole("button", { name: "Continuar a Debate" }),
	).toBeVisible({ timeout: 15_000 });

	await page.getByRole("button", { name: "Continuar a Debate" }).click();
	await expect(page.getByText("Debate terminado")).toBeVisible();

	await page.getByRole("button", { name: "Continuar a Cierre" }).click();
	await expect(page.getByText(/fin de la tertulia/i)).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Cerrar sesión" }),
	).toBeVisible();

	await page.getByRole("button", { name: "Cerrar sesión" }).click();
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Cerrar sesión" })
		.click();

	await expect(
		page.getByRole("heading", { name: "Sesión finalizada" }),
	).toBeVisible();
});
