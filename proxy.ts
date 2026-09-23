import { type NextRequest } from "next/server";
import {
	LAST_GROUP_COOKIE,
	slugFromGroupPath,
} from "@/lib/groups/active-group";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
	const response = await updateSession(request);
	const slug = slugFromGroupPath(request.nextUrl.pathname);
	if (slug) {
		response.cookies.set(LAST_GROUP_COOKIE, slug, {
			path: "/",
			maxAge: 60 * 60 * 24 * 400,
			sameSite: "lax",
		});
	}
	return response;
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
