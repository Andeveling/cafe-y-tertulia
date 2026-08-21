/** Same name `SidebarProvider` writes on toggle (`components/ui/sidebar.tsx`). */
export const SIDEBAR_COOKIE_NAME = "sidebar_state";

/** Missing cookie keeps the shadcn default: open. */
export function sidebarOpenFromCookie(value: string | undefined): boolean {
	return value !== "false";
}
