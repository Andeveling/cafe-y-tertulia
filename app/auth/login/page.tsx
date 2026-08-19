import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/memberships/actions";
import { getCurrentMember } from "@/lib/memberships/current-member";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string; email?: string; left?: string }>;
}) {
	const params = await searchParams;
	const { member } = await getCurrentMember();
	if (member) {
		redirect("/");
	}

	return (
		<div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
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

				{params.left === "1" && (
					<div
						role="status"
						className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground"
					>
						Te diste de baja. Tus aportes quedan como memoria del club.
					</div>
				)}

				<form action={signIn} className="space-y-4">
					<Field>
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<FieldContent>
							<Input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								defaultValue={params.email ?? ""}
								placeholder="tucorreo@ejemplo.com"
							/>
						</FieldContent>
					</Field>
					<Field>
						<FieldLabel htmlFor="password">Contraseña</FieldLabel>
						<FieldContent>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								placeholder="••••••••"
							/>
						</FieldContent>
					</Field>
					<Button type="submit" className="w-full">
						Iniciar sesión
					</Button>
				</form>

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
