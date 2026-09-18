import { ResetPasswordForm } from "@/app/auth/reset/_components/reset-password-form";

export default async function ResetPasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ sent?: string; error?: string }>;
}) {
	const params = await searchParams;

	return (
		<div className="flex min-h-dvh flex-1 flex-col items-center justify-center px-4">
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

				{!params.sent && <ResetPasswordForm />}
			</div>
		</div>
	);
}
