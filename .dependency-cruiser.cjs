/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
	forbidden: [
		// ── Regla 0: no ciclos ──────────────────────────────────────────────
		{
			name: "no-circular",
			severity: "error",
			from: {},
			to: { circular: true },
		},

		// ── Regla 1: _components no importa de _lib (solo al revés) ─────────
		{
			name: "components-no-import-from-lib",
			comment:
				"Los componentes importan de _lib, pero _lib nunca de _components.",
			severity: "error",
			from: { path: "app/.*/_lib/" },
			to: { path: "app/.*/_components/" },
		},

		// ── Regla 2: _lib no importa de pages ───────────────────────────────
		{
			name: "lib-no-import-from-pages",
			severity: "error",
			from: { path: "app/.*/_lib/" },
			to: { path: "app/.*/page\\.tsx$" },
		},

		// ── Regla 3: constants.ts es hoja — no importa de otros _lib ────────
		{
			name: "constants-is-leaf",
			comment:
				"constants.ts solo importa de types globales, nunca de otros módulos _lib.",
			severity: "error",
			from: { path: "app/.*/_lib/constants\\.ts$" },
			to: { path: "app/.*/_lib/(?!constants)" },
		},

		// ── Regla 4: snapshot-codec.ts es hoja ──────────────────────────────
		{
			name: "snapshot-codec-is-leaf",
			severity: "error",
			from: { path: "app/.*/_lib/snapshot-codec\\.ts$" },
			to: { path: "app/.*/_lib/(?!snapshot-codec)" },
		},

		// ── Regla 5: actions no importa de components ───────────────────────
		{
			name: "actions-no-import-components",
			severity: "error",
			from: { path: "app/.*/_lib/.*-actions\\.ts$" },
			to: { path: "app/.*/_components/" },
		},

		// ── Regla 6: un feature no importa de otro feature ──────────────────
		{
			name: "no-cross-feature-imports",
			comment:
				"Cada feature (materials, profile, auth, invite) es autónomo. lib/ y components/ui/ son compartidos.",
			severity: "error",
			from: { path: "app/materials/" },
			to: { path: "app/(profile|auth|invite)/" },
		},
		{
			name: "no-cross-feature-imports-reverse",
			severity: "error",
			from: { path: "app/(profile|auth|invite)/" },
			to: { path: "app/materials/" },
		},

		// ── Regla 7: seat de la Sala solo vía actions o página ───────────────
		{
			name: "seat-via-sala",
			comment:
				"room-seat es seam interno: solo room-actions y la página de la Sala lo importan.",
			severity: "error",
			from: {
				pathNot:
					"app/materials/_lib/room-actions(\\.ts)?$|app/materials/sessions/\\[id\\]/room/page(\\.tsx)?$",
			},
			to: { path: "app/materials/_lib/room-seat(\\.ts)?$" },
		},

		// ── Regla 8: roster de la Sala solo vía su página ───────────────────
		{
			name: "roster-via-sala-page",
			comment:
				"room-roster es seam interno: solo la página de la Sala lo importa.",
			severity: "error",
			from: {
				pathNot: "app/materials/sessions/\\[id\\]/room/page\\.tsx$",
			},
			to: { path: "app/materials/_lib/room-roster(\\.ts)?$" },
		},

		// ── Regla 9: gate del Grupo solo vía el seam ────────────────────────
		{
			name: "grupo-gate-via-seam",
			comment:
				"Las páginas de /g/{slug} resuelven miembro+grupo vía page-gate, nunca directo.",
			severity: "error",
			from: { path: "app/g/\\[slug\\]/" },
			to: { path: "lib/(current-member|auth/redirect)" },
		},

		// ── Reglas base ─────────────────────────────────────────────────────
		{
			name: "not-to-deprecated",
			severity: "warn",
			from: {},
			to: { dependencyTypes: ["deprecated"] },
		},
		{
			name: "no-non-package-json",
			severity: "error",
			from: {},
			to: { dependencyTypes: ["npm-no-pkg", "npm-unknown"] },
		},
	],

	options: {
		doNotFollow: {
			path: "node_modules",
			dependencyTypes: [
				"npm",
				"npm-dev",
				"npm-optional",
				"npm-peer",
				"npm-bundled",
			],
		},

		enhancedResolveOptions: {
			exportsFields: ["exports"],
			conditionNames: ["import", "require", "node", "default"],
			extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
		},

		exclude: {
			path: [
				"node_modules",
				"\\.next",
				"dist",
				"build",
				"biome-plugins",
				"supabase/migrations",
				"supabase/seeds",
				"tests",
			],
		},

		tsPreCompilationDeps: true,
		reporterOptions: {
			dot: {
				collapsePattern: "node_modules/[^/]+",
			},
		},
	},
};
