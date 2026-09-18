import { InvitationList } from "@/app/invite/_components/invitation-list";
import { InviteForm } from "@/app/invite/_components/invite-form";
import { InviteLinkPanel } from "@/app/invite/_components/invite-link-panel";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { InvitationRow } from "../_lib/invitation-time";

const INVITE_ERRORS: Record<string, string> = {
	invalid_email: "Ese email no parece válido.",
	not_active_member: "Solo los Miembros activos pueden invitar.",
	already_member: "Esa persona ya es Miembro del club.",
	left_member: "Esa persona se dio de baja del club.",
	already_invited_pending:
		"Ya hay una invitación pendiente. Revocala o esperá a que venza.",
	send_failed: "No pudimos crear el enlace. Intentá de nuevo en un momento.",
	not_found: "No encontramos esa invitación.",
	not_pending: "Esa invitación ya no está pendiente.",
};

const NOTICES: Record<"invited" | "revoked" | "resent", string> = {
	invited: "Enlace listo. Copialo o compartilo por WhatsApp.",
	revoked: "Invitación revocada. El enlace ya no vale.",
	resent: "Nuevo enlace listo. El anterior ya no vale.",
};

export type InviteViewProps = {
	invitations: InvitationRow[];
	notice?: "invited" | "revoked" | "resent";
	error?: string;
};

export function InviteView({ invitations, notice, error }: InviteViewProps) {
	const featured =
		notice === "invited" || notice === "resent"
			? invitations.find((inv) => inv.status === "pending" && inv.url)
			: undefined;

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<h1 className="font-heading text-2xl font-semibold">Invitar</h1>
				<p className="text-sm text-muted-foreground">
					Cualquier Miembro activo puede invitar. El enlace vale 7 días; el
					padrino puede revocarlo antes.
				</p>
			</div>

			{notice && NOTICES[notice] && (
				<div
					role="status"
					className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground"
				>
					{NOTICES[notice]}
				</div>
			)}

			{error && INVITE_ERRORS[error] && (
				<div
					role="alert"
					className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
				>
					{INVITE_ERRORS[error]}
				</div>
			)}

			{featured?.url && (
				<Card>
					<CardHeader>
						<CardTitle>Enlace para {featured.email}</CardTitle>
						<CardDescription>
							Copiá o compartí este enlace. Vale 7 días y es de un solo uso.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<InviteLinkPanel invitationId={featured.id} url={featured.url} />
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Nueva invitación</CardTitle>
					<CardDescription>
						Indicá el email. Recibís un enlace para copiar y mandar por el canal
						que quieras.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<InviteForm />
				</CardContent>
			</Card>

			<InvitationList invitations={invitations} />
		</div>
	);
}
