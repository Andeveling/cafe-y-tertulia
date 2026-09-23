"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

/** Diálogo bajo el fold: se trocea del bundle inicial (bundle-dynamic-imports). */
const LeaveClubDialog = dynamic(
	() => import("./leave-club-dialog").then((m) => m.LeaveClubDialog),
	{
		ssr: false,
		loading: () => (
			<Button variant="destructive" className="min-h-11" disabled>
				Darme de baja
			</Button>
		),
	},
);

export function LeaveClubDialogLazy() {
	return <LeaveClubDialog />;
}
