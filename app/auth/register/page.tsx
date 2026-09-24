import { redirect } from "next/navigation";
import { safeNextPath, withNext } from "@/lib/auth/redirect";
import { getCurrentMember } from "@/lib/current-member";
import { RegisterForm } from "./_components/register-form";

/**
 * Registro abierto (ADR-0014): cualquiera crea su cuenta de Miembro sin
 * padrino. El `next` conserva el retorno (p. ej. /g/unirse?token=…) a
 * través del alta para canjear en un solo gesto.
 */
export default async function RegisterPage({
	searchParams,
}: {
	searchParams: Promise<{ next?: string; email?: string }>;
}) {
	const params = await searchParams;
	const next = safeNextPath(params.next);
	const { member } = await getCurrentMember();
	if (member?.status === "active") {
		redirect(next);
	}
	const loginHref = withNext("/auth/login", next);

	return (
		<div className="flex min-h-dvh flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<RegisterForm
					defaultEmail={params.email}
					next={next}
					loginHref={loginHref}
				/>
			</div>
		</div>
	);
}
