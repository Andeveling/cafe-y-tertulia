import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updatePassword } from "@/lib/memberships/actions";

export default async function UpdatePasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const params = await searchParams;

	return (
		<div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						Nueva contraseña
					</h1>
					<p className="text-sm text-muted-foreground">
						Elegí una contraseña nueva para tu cuenta.
					</p>
				</div>

				{params.error === "invalid" && (
					<div
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
					>
						La contraseña debe tener al menos 6 caracteres.
					</div>
				)}

				<form action={updatePassword} className="space-y-4">
					<Field>
						<FieldLabel htmlFor="password">Contraseña nueva</FieldLabel>
						<FieldContent>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete="new-password"
								required
								minLength={6}
								placeholder="Mínimo 6 caracteres"
							/>
						</FieldContent>
					</Field>
					<Button type="submit" className="w-full">
						Cambiar contraseña
					</Button>
				</form>
			</div>
		</div>
	);
}
