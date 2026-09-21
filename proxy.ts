import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
	return await updateSession(request);
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - Everything under /auth and /login
		 * - File-convention metadata sin extensión (crawlers sin sesión:
		 *   opengraph-image, twitter-image, manifest.webmanifest)
		 * - Public files
		 * - Prototipos throwaway (/prototype/*): se miran sin sesión
		 */
		"/((?!_next/static|_next/image|favicon.ico|auth|login|prototype|opengraph-image|twitter-image|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
