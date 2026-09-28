// Levanta `vitest --ui` y muestra la URL con token.
//
// Por qué existe: desde Vitest 5 la UI exige autenticación con `?token=...`.
// Si abres `http://localhost:PUERTO/__vitest__/` a mano, pide el token.
// Este script captura la URL completa que imprime vitest y la abre sola.
//
// Uso:
//   node scripts/vitest-ui.mjs            (abre el navegador con la URL con token)
//   node scripts/vitest-ui.mjs --no-open  (solo imprime la URL, no abre nada)
//   bun run test:ui
//
// Los demás argumentos se reenvían a vitest tal cual:
//   node scripts/vitest-ui.mjs tests/board-helpers.test.ts

import { spawn } from "node:child_process";

const AUTHENTICATED_UI_URL_PATTERN =
	/(http:\/\/localhost:\d+\/__vitest__\/\?token=[\w-]+)/;

function shouldAutoOpen(scriptArguments) {
	return !scriptArguments.includes("--no-open");
}

function vitestArguments(scriptArguments) {
	return ["vitest", "--ui", "--open=false"].concat(
		scriptArguments.filter((argument) => argument !== "--no-open"),
	);
}

function openUrlInBrowser(url) {
	const platformCommands = {
		darwin: ["open", [url]],
		win32: ["cmd", ["/c", "start", "", url]],
	};
	const [command, commandArguments] =
		platformCommands[process.platform] ?? ["xdg-open", [url]];
	const opener = spawn(command, commandArguments, {
		detached: true,
		stdio: "ignore",
	});
	opener.on("error", () => {
		// Abrir el navegador es un extra: si falla, la URL impresa basta.
	});
	opener.unref();
}

function forwardAndWatch(child, onAuthenticatedUrl) {
	let alreadyResolved = false;
	const inspectChunk = (chunk) => {
		process.stdout.write(chunk);
		if (alreadyResolved) {
			return;
		}
		const match = chunk.toString().match(AUTHENTICATED_UI_URL_PATTERN);
		if (match) {
			alreadyResolved = true;
			onAuthenticatedUrl(match[1]);
		}
	};
	child.stdout.on("data", inspectChunk);
	child.stderr.on("data", inspectChunk);
}

function main() {
	const scriptArguments = process.argv.slice(2);
	const child = spawn("bunx", vitestArguments(scriptArguments), {
		stdio: ["inherit", "pipe", "pipe"],
	});

	child.on("error", (error) => {
		console.error(`No se pudo arrancar vitest: ${error.message}`);
		process.exit(1);
	});

	forwardAndWatch(child, (authenticatedUrl) => {
		console.log(`\n✅ Vitest UI lista (con token incluido):\n\n   ${authenticatedUrl}\n`);
		if (shouldAutoOpen(scriptArguments)) {
			openUrlInBrowser(authenticatedUrl);
		}
	});

	child.on("close", (exitCode) => {
		process.exit(exitCode ?? 0);
	});
}

main();
