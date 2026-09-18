/** Rutas sin chrome del club: ocupan toda la pantalla. */

export function isSalaPath(pathname: string | null | undefined): boolean {
	if (!pathname) return false;
	return /^\/materials\/sessions\/[^/]+\/room\/?$/.test(pathname);
}

export function isAuthPath(pathname: string | null | undefined): boolean {
	if (!pathname) return false;
	return pathname === "/auth" || pathname.startsWith("/auth/");
}
