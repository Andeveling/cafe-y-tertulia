import { redirect } from "next/navigation";
import { joinGroupWithToken } from "@/app/g/_lib/group-actions";
import { verifyGroupInviteToken } from "@/app/g/_lib/group-invite";
import { getCurrentMember } from "@/lib/current-member";

export const metadata = { title: "Unirse al grupo · Café y Tertulia" };

/**
 * /g/unirse?token=… — canje del enlace de Invitación a un Grupo privado.
 * Sin cuenta va a registro con retorno: registrarse mete al Grupo en un
 * solo gesto (el token sobrevive vía `next`). Re-canjear siendo ya
 * Miembro del Grupo es idempotente: entra sin error ni duplicado.
 */
export default async function JoinGroupPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;
	if (!token) redirect("/g");

	const next = `/g/unirse?token=${token}`;
	const registerWithReturn = `/auth/register?next=${encodeURIComponent(next)}`;

	const { member } = await getCurrentMember();
	if (!member) redirect(registerWithReturn);
	if (member.status === "left") redirect("/auth/login?error=left");
	if (member.status !== "active") redirect(registerWithReturn);

	const claims = await verifyGroupInviteToken(token);
	if (!claims) {
		return (
			<JoinError
				title="Enlace no válido"
				message="Este enlace de invitación no vale. Pedile uno nuevo al administrador del grupo."
			/>
		);
	}

	const result = await joinGroupWithToken(token);
	if (!result.ok) {
		return <JoinError title="No pudiste unirte" message={result.error} />;
	}

	redirect(`/g/${result.slug}`);
}

function JoinError({ title, message }: { title: string; message: string }) {
	return (
		<div className="flex flex-col gap-2">
			<h1 className="font-serif text-2xl font-semibold">{title}</h1>
			<p className="text-sm text-muted-foreground">{message}</p>
		</div>
	);
}
