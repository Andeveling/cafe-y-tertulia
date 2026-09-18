import { redirect } from "next/navigation";
import { LoginForm } from "@/app/auth/login/_components/login-form";
import { getCurrentMember } from "@/lib/current-member";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{
		error?: string;
		email?: string;
		password_updated?: string;
	}>;
}) {
	const params = await searchParams;
	const { member } = await getCurrentMember();
	if (member) {
		redirect("/");
	}

	return (
		<div className="flex min-h-dvh flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						Café y Tertulias
					</h1>
					<p className="text-sm text-muted-foreground">
						Iniciá sesión para participar del club.
					</p>
				</div>

				{params.error === "invalid" && (
					<div
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
					>
						Email o contraseña incorrectos.
					</div>
				)}

				{params.error === "left" && (
					<div
						role="status"
						className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground"
					>
						Te diste de baja. Tus aportes quedan como memoria del club.
					</div>
				)}

				{params.error === "pending" && (
					<div
						role="status"
						className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground"
					>
						Todavía no activaste tu membresía. Revisá el enlace de invitación
						que recibiste por email.
					</div>
				)}

				{params.password_updated === "1" && (
					<div
						role="status"
						className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground"
					>
						Contraseña actualizada. Ya podés iniciar sesión.
					</div>
				)}

				<LoginForm defaultEmail={params.email} />

				<p className="text-center text-sm text-muted-foreground">
					¿Te invitaron al club?{" "}
					<a
						href="/auth/register"
						className="font-medium text-primary underline underline-offset-4"
					>
						Usá tu invitación
					</a>
				</p>
				<p className="text-center text-sm text-muted-foreground">
					¿Olvidaste tu contraseña?{" "}
					<a
						href="/auth/reset"
						className="font-medium text-primary underline underline-offset-4"
					>
						Recuperala
					</a>
				</p>
			</div>
		</div>
	);
}
