import { redirect } from "next/navigation";
import { RegisterForm } from "@/app/auth/register/_components/register-form";
import { getCurrentMember } from "@/lib/current-member";

export default async function RegisterPage() {
	const { member } = await getCurrentMember();
	if (member?.status === "active") {
		redirect("/");
	}

	return (
		<div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<RegisterForm />
				<p className="text-center text-sm text-muted-foreground">
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
