/**
 * Public origin for auth emails (invite, reset). Never emit a bare host:
 * GoTrue treats a non-absolute redirectTo as invalid and falls back to
 * the project's Site URL (often localhost).
 */
export function siteUrl(): string {
	const raw =
		process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
		process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
		process.env.VERCEL_URL?.trim() ||
		"http://127.0.0.1:3000";
	const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
	return withProtocol.replace(/\/$/, "");
}
