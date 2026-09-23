import { redirect } from "next/navigation";
import { joinGroupWithToken } from "@/app/g/_lib/group-actions";
import { verifyGroupInviteToken } from "@/app/g/_lib/group-invite";
import { getCurrentMember } from "@/lib/current-member";

export const metadata = { title: "Unirse al grupo · Café y Tertulia" };

/**
 * /g/unirse?token=… — canje del enlace de invitación a un grupo privado.
 * Sin sesión va a login y vuelve con el token.
 */
export default async function JoinGroupPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;
	if (!token) redirect("/g");

	const { member } = await getCurrentMember();
	if (!member)
		redirect(
			`/auth/login?next=${encodeURIComponent(`/g/unirse?token=${token}`)}`,
		);
	if (member.status !== "active") redirect("/auth/invite");

	const claims = await verifyGroupInviteToken(token);
	if (!claims) {
		return (
			<JoinError
				title="Enlace no válido"
				message="Este enlace de invitación no vale. Pide uno nuevo al administrador del grupo."
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
