import { expect, type Page, test } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "andresparra.nojau@gmail.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "cafe1234";
const OBSERVER_EMAIL = process.env.E2E_EMAIL2 ?? "edwarsanz.nojau@gmail.com";
const OBSERVER_PASSWORD = process.env.E2E_PASSWORD2 ?? PASSWORD;

async function signIn(page: Page, email = EMAIL, password = PASSWORD) {
	await page.goto("/auth/login");
	await page.getByRole("textbox", { name: "Email" }).fill(email);
	await page.getByRole("textbox", { name: "Contraseña" }).fill(password);
	await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

async function createSession(page: Page, label: string) {
	await page
		.getByRole("button", { name: /nueva sesión|crear la primera sesión/i })
		.click();
	await page.getByLabel("Etiqueta").fill(label);
	await page.getByRole("button", { name: "Crear" }).click();
	await expect(page).toHaveURL(/\/materials\/sessions\/[^/]+\/room$/);
}

async function askQuestion(page: Page, text: string, count: number) {
	await page
		.getByRole("textbox", {
			name: "¿Qué pregunta quieres hacer sobre el material?",
		})
		.fill(text);
	await page.getByRole("button", { name: "Enviar pregunta" }).click();
	await expect(page.getByText(`${count} pregunta enviada`)).toBeVisible();
}

test("cierre sin material no ofrece votación y deja cerrar", async ({
	page,
}) => {
	test.setTimeout(90_000);

	await signIn(page);
	await createSession(page, `e2e sinmat ${Date.now()}`);
	await askQuestion(page, "¿Qué te dejó esta tertulia?", 1);

	await page.getByRole("button", { name: "Continuar a Presentes" }).click();
	await page.getByRole("button", { name: "Confirmar asistencia" }).click();
	await expect(page.getByText("1/1 listos")).toBeVisible();

	await page.getByRole("button", { name: "Continuar a Sorteo" }).click();
	await page.getByRole("button", { name: "Sortear" }).click();
	await expect(
		page.getByRole("button", { name: "Continuar a Debate" }),
	).toBeVisible({ timeout: 15_000 });
	await page.getByRole("button", { name: "Continuar a Debate" }).click();

	// Un solo miembro no puede autoasignarse: debate vacío y Cierre directo.
	await expect(page.getByText("Debate terminado")).toBeVisible();
	await page.getByRole("button", { name: "Continuar a Cierre" }).click();

	await expect(page.getByText("Sin material")).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Abrir votación" }),
	).toBeHidden();
	await expect(
		page.getByRole("button", { name: "Cerrar sesión" }),
	).toBeEnabled();

	await page.getByRole("button", { name: "Cerrar sesión" }).click();
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Cerrar sesión" })
		.click();
	await expect(
		page.getByRole("heading", { name: "Sesión finalizada" }),
	).toBeVisible();
});

test("el moderador ve Todos listos en vez de Esperando al moderador", async ({
	browser,
}) => {
	test.setTimeout(90_000);

	const moderator = await browser.newContext();
	const observer = await browser.newContext();
	const modPage = await moderator.newPage();
	const obsPage = await observer.newPage();

	await signIn(modPage, EMAIL, PASSWORD);
	await createSession(modPage, `e2e banner ${Date.now()}`);
	const roomUrl = modPage.url();
	await askQuestion(modPage, "¿Qué te dejó esta tertulia?", 1);

	await signIn(obsPage, OBSERVER_EMAIL, OBSERVER_PASSWORD);
	try {
		await obsPage.waitForURL((url) => url.pathname === "/", {
			timeout: 15_000,
		});
	} catch {
		if (
			await obsPage
				.getByRole("alert")
				.filter({ hasText: /incorrectos/i })
				.isVisible()
				.catch(() => false)
		) {
			test.skip(true, "second member login unavailable in this env");
		}
		throw new Error("observer login did not reach home");
	}
	await obsPage.goto(roomUrl);
	await askQuestion(obsPage, "¿Qué personaje te marcó?", 1);

	await modPage.getByRole("button", { name: "Continuar a Presentes" }).click();
	await expect(
		modPage.getByRole("heading", { name: "Presentes" }),
	).toBeVisible();
	await expect(obsPage.getByRole("heading", { name: "Presentes" })).toBeVisible(
		{
			timeout: 15_000,
		},
	);

	await modPage.getByRole("button", { name: "Confirmar asistencia" }).click();
	await obsPage.getByRole("button", { name: "Confirmar asistencia" }).click();

	await expect(modPage.getByText("2/2 listos")).toBeVisible({
		timeout: 15_000,
	});
	await expect(modPage.getByText("Todos listos")).toBeVisible();
	await expect(
		modPage.getByText("Ejecuta el sorteo para continuar."),
	).toBeVisible();
	await expect(obsPage.getByText("Esperando al moderador")).toBeVisible({
		timeout: 15_000,
	});

	await moderator.close();
	await observer.close();
});
