import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { config as proxyConfig } from "@/proxy";

const root = process.cwd();
const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function bytes(rel: string): Buffer {
	return readFileSync(join(root, rel));
}

describe("marca Café y Tertulias", () => {
	it("variaciones SVG limpias en public/brand", () => {
		for (const file of ["coffee.svg", "coffee-mono.svg", "coffee-badge.svg"]) {
			const rel = `public/brand/${file}`;
			expect(existsSync(join(root, rel)), rel).toBe(true);
			const svg = bytes(rel).toString("utf8");
			expect(svg).toContain('viewBox="0 0 1024 1024"');
			expect(svg).not.toContain("DOCTYPE");
			expect(svg).not.toContain("SVGRepo");
		}
		expect(bytes("public/brand/coffee-mono.svg").toString("utf8")).toContain(
			"currentColor",
		);
	});

	it("convenciones de iconos de Next (favicon, icon, apple-icon)", () => {
		expect(bytes("app/icon.svg").toString("utf8")).toContain("viewBox");
		const favicon = bytes("app/favicon.ico");
		expect(favicon.subarray(0, 4)).toEqual(
			Buffer.from([0x00, 0x00, 0x01, 0x00]),
		);
		expect(favicon.length).toBeGreaterThan(1000);
		expect(bytes("app/apple-icon.png").subarray(0, 8)).toEqual(pngMagic);
	});

	it("PNG del manifest existen y no están vacíos", () => {
		for (const icon of [
			"icon-192.png",
			"icon-512.png",
			"icon-512-maskable.png",
		]) {
			const rel = `public/icons/${icon}`;
			expect(statSync(join(root, rel)).size).toBeGreaterThan(1000);
			expect(bytes(rel).subarray(0, 8)).toEqual(pngMagic);
		}
	});

	it("manifest referencia los iconos generados", () => {
		const data = manifest();
		expect(data.name).toBe("Café y Tertulias");
		expect(data.icons?.map((i) => i.src)).toEqual([
			"/icons/icon-192.png",
			"/icons/icon-512.png",
			"/icons/icon-512-maskable.png",
		]);
	});

	it("OG de home declara alt, tamaño y tipo", () => {
		for (const rel of ["app/opengraph-image.tsx", "app/twitter-image.tsx"]) {
			const src = bytes(rel).toString("utf8");
			expect(src).toContain("ImageResponse");
			expect(src).toContain("Café y Tertulias");
			expect(src).toContain("1200");
			expect(src).toContain("image/png");
		}
		const layout = bytes("app/layout.tsx").toString("utf8");
		expect(layout).toContain("metadataBase");
		expect(layout).toContain("openGraph");
		expect(layout).toContain("summary_large_image");
	});

	it("sidebar usa el logo de la marca", () => {
		const sidebar = bytes("components/active-group-switcher.tsx").toString(
			"utf8",
		);
		expect(sidebar).toContain('src="/brand/coffee.svg"');
	});

	it("proxy deja pasar metadata sin sesión (crawlers sociales)", () => {
		const patterns = proxyConfig.matcher.map(
			(matcher) => new RegExp(`^${matcher}$`),
		);
		const pasaPorProxy = (path: string) =>
			patterns.some((pattern) => pattern.test(path));
		for (const publica of [
			"/opengraph-image",
			"/twitter-image",
			"/manifest.webmanifest",
			"/favicon.ico",
			"/icon.svg",
			"/apple-icon.png",
			"/auth/login",
		]) {
			expect(pasaPorProxy(publica), publica).toBe(false);
		}
		for (const privada of ["/", "/materials", "/invite", "/profile"]) {
			expect(pasaPorProxy(privada), privada).toBe(true);
		}
	});
});
