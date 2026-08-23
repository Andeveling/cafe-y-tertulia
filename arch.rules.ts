import path from "node:path";
import { fileURLToPath } from "node:url";
import { project } from "@nielspeter/ts-archunit";
import { recommended, strictBoundaries } from "@nielspeter/ts-archunit/presets";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(__dirname, "app");

const p = project("tsconfig.json");

export default [
	// Safety floor — adapted to app/ layout.
	...recommended(p, { include: `${appDir}/**` }),

	// Feature isolation: ningún feature importa de otro.
	...strictBoundaries(p, {
		folders: `${appDir}/*`,
		shared: [
			`${appDir}/_lib/**`,
			`${appDir}/layout.tsx`,
			path.join(__dirname, "lib") + "/**",
			path.join(__dirname, "components") + "/**",
		],
	}),
];
