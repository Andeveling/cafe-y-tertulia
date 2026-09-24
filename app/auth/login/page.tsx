import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/auth/login/_components/login-form";
import { safeNextPath } from "@/lib/auth/redirect";
import { getCurrentMember } from "@/lib/current-member";

export const metadata: Metadata = {
	title: "Entrar · Café y Tertulias",
	description:
		"Club de lectura y conversación. Sesiones, materiales y tertulia — el club te espera.",
	openGraph: {
		title: "Café y Tertulias",
		description:
			"Club de lectura y conversación. Sesiones, materiales y tertulia — el club te espera.",
		images: [
			{
				url: "/opengraph-image",
				width: 1200,
				height: 630,
				alt: "Café y Tertulias — Club de lectura y conversación",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Café y Tertulias",
		description:
			"Club de lectura y conversación. Sesiones, materiales y tertulia — el club te espera.",
		images: ["/twitter-image"],
	},
};

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{
		error?: string;
		email?: string;
		next?: string;
		password_updated?: string;
	}>;
}) {
	const params = await searchParams;
	const { member } = await getCurrentMember();
	if (member) {
		redirect(safeNextPath(params.next));
	}
	const next = safeNextPath(params.next);
	const registerHref =
		next === "/"
			? "/auth/register"
			: `/auth/register?next=${encodeURIComponent(next)}`;

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
						Ese padrinazgo ya no vale. Creá tu cuenta en el registro abierto.
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

				<LoginForm defaultEmail={params.email} next={next} />

				<p className="text-center text-sm text-muted-foreground">
					¿Todavía no tenés cuenta?{" "}
					<a
						href={registerHref}
						className="font-medium text-primary underline underline-offset-4"
					>
						Creá una
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
