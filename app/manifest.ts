import type { MetadataRoute } from "next";
import palette from "./_lib/brand-palette.json";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Café y Tertulias",
		short_name: "Tertulia",
		description:
			"Club de lectura y conversación. Sesiones, materiales y tertulia.",
		start_url: "/",
		scope: "/",
		display: "standalone",
		orientation: "portrait",
		lang: "es",
		dir: "ltr",
		background_color: palette.lounge,
		theme_color: palette.amber,
		categories: ["books", "social", "lifestyle"],
		icons: [
			{
				src: "/icons/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icons/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icons/icon-512-maskable.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
