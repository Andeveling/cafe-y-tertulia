import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/memberships/actions";

export default async function ResetPasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ sent?: string; error?: string }>;
}) {
	const params = await searchParams;

	return (
		<div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						Recuperar contraseña
					</h1>
					<p className="text-sm text-muted-foreground">
						Te enviamos un enlace para restablecerla.
					</p>
				</div>

				{params.sent === "1" && (
					<div
						role="status"
						className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground"
					>
						Si existe una cuenta con ese email, vas a recibir un enlace para
						cambiar tu contraseña.
					</div>
				)}

				{!params.sent && (
					<form action={requestPasswordReset} className="space-y-4">
						<Field>
							<FieldLabel htmlFor="email">Email</FieldLabel>
							<FieldContent>
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									placeholder="tucorreo@ejemplo.com"
								/>
							</FieldContent>
						</Field>
						<Button type="submit" className="w-full">
							Enviar enlace
						</Button>
					</form>
				)}
			</div>
		</div>
	);
}
