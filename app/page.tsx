import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentMember } from "@/lib/current-member";

export default async function HomePage() {
	const { member } = await getCurrentMember();

	if (!member) {
		redirect("/auth/login");
	}

	// Only an active membership opens the app; an invited member with a live
	// invite-link session must finish accepting first (SPEC §2.1, ADR 0005).
	if (member.status !== "active") {
		redirect("/auth/invite");
	}

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-6 bg-card px-4">
			<div className="text-center">
				<h1 className="text-3xl font-semibold tracking-tight">
					Café y Tertulias
				</h1>
				<p className="mt-2 text-muted-foreground">
					Hola, {member.display_name || "Miembro"} — el club te espera.
				</p>
			</div>
			<div className="flex gap-3">
				<Button
					variant="outline"
					nativeButton={false}
					render={<a href="/invite" />}
				>
					Invitar a alguien
				</Button>
				<Button nativeButton={false} render={<a href="/profile" />}>
					Tu perfil
				</Button>
			</div>
		</div>
	);
}
