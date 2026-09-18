import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/current-member";

export default async function RegisterPage() {
	const { member } = await getCurrentMember();
	if (member?.status === "active") {
		redirect("/");
	}

	return (
		<div className="flex min-h-dvh flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-4 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">
					Hace falta el enlace
				</h1>
				<p className="text-sm text-muted-foreground">
					El alta al club es por Invitación. Pedile el enlace a tu padrino.
				</p>
				<p className="text-sm text-muted-foreground">
					¿Ya tenés cuenta?{" "}
					<a
						href="/auth/login"
						className="font-medium text-primary underline underline-offset-4"
					>
						Iniciá sesión
					</a>
				</p>
			</div>
		</div>
	);
}
