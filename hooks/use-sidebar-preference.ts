"use client";

import { useSidebar } from "@/components/ui/sidebar";

export function useSidebarPreference() {
	const { isMobile, open, openMobile, toggleSidebar } = useSidebar();

	return {
		open: isMobile ? openMobile : open,
		toggleSidebar,
	};
}
