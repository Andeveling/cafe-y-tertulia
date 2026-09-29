import { withEve } from "eve/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: [
		"127.0.0.1",
		"localhost",
		"127.0.0.1:3000",
		"localhost:3000",
	],
	/**
	 * Rutas esapnolizadas renombradas a inglés: los enlaces viejos
	 * (invitaciones compartidas, marcadores) siguen llegando.
	 */
	async redirects() {
		return [
			{
				source: "/g/:slug/materiales/:path*",
				destination: "/g/:slug/materials/:path*",
				permanent: true,
			},
			{
				source: "/g/:slug/sesiones/:path*",
				destination: "/g/:slug/sessions/:path*",
				permanent: true,
			},
			{
				source: "/g/:slug/ajustes/:path*",
				destination: "/g/:slug/settings/:path*",
				permanent: true,
			},
			{
				source: "/g/unirse",
				destination: "/g/join",
				permanent: true,
			},
		];
	},
};

export default withEve(nextConfig);
