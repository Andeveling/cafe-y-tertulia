import { redirect } from "next/navigation";
import { InvitationList } from "@/app/invite/_components/invitation-list";
import { InviteForm } from "@/app/invite/_components/invite-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getCurrentMember } from "@/lib/current-member";

const INVITE_ERRORS: Record<string, string> = {
	invalid_email: "Ese email no parece válido.",
	not_active_member: "Solo los Miembros activos pueden invitar.",
	already_member: "Esa persona ya es Miembro del club.",
	left_member: "Esa persona se dio de baja del club.",
	already_invited_pending:
		"Ya hay una invitación pendiente. Revocala o esperá a que venza.",
	send_failed:
		"No pudimos enviar la invitación. Intentá de nuevo en un momento.",
	not_found: "No encontramos esa invitación.",
	not_pending: "Esa invitación ya no está pendiente.",
};

export default async function InvitePage({
	searchParams,
}: {
	searchParams: Promise<{ invited?: string; revoked?: string; error?: string }>;
}) {
	const params = await searchParams;
	const { supabase, member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	if (member.status !== "active") {
		redirect("/");
	}

	const { data: invitations } = await supabase
		.from("invitations")
		.select("id, email, status, expires_at, created_at")
		.eq("invited_by", member.id)
		.order("created_at", { ascending: false });

	return (
		<div className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 md:max-w-4xl md:px-8 md:py-10 lg:max-w-5xl">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">Invitar</h1>
				<p className="text-sm text-muted-foreground">
					Cualquier Miembro activo puede invitar. La invitación vence a las 24
					horas; el padrino puede revocarla antes.
				</p>
			</div>

			{params.invited === "1" && (
				<div
					role="status"
					className="mt-4 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground"
				>
					Invitación enviada. Cuando la persona acepte, se sumará al club.
				</div>
			)}

			{params.revoked === "1" && (
				<div
					role="status"
					className="mt-4 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground"
				>
					Invitación revocada. El enlace ya no vale.
				</div>
			)}

			{params.error && INVITE_ERRORS[params.error] && (
				<div
					role="alert"
					className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
				>
					{INVITE_ERRORS[params.error]}
				</div>
			)}

			<Card className="mt-6">
				<CardHeader>
					<CardTitle>Nueva invitación</CardTitle>
					<CardDescription>
						La persona recibe un correo en español con un enlace de un solo uso,
						válido por 24 horas.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<InviteForm />
				</CardContent>
			</Card>

			<InvitationList invitations={invitations ?? []} />
		</div>
	);
}
