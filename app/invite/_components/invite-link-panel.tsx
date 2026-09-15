import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { whatsappInviteHref } from "../_lib/invitation-time";
import { resend } from "../_lib/invite-actions";
import { CopyLinkButton } from "./copy-link-button";

export function InviteLinkPanel({
	invitationId,
	url,
}: {
	invitationId: string;
	url: string;
}) {
	return (
		<div className="space-y-3">
			<Input readOnly value={url} aria-label="Enlace de invitación" />
			<div className="flex flex-wrap gap-2">
				<CopyLinkButton url={url} size="default" />
				<Button
					variant="outline"
					nativeButton={false}
					render={
						<a
							href={whatsappInviteHref(url)}
							target="_blank"
							rel="noopener noreferrer"
						/>
					}
				>
					Compartir por WhatsApp
				</Button>
				<form action={resend}>
					<input type="hidden" name="id" value={invitationId} />
					<Button type="submit" variant="ghost">
						Reenviar
					</Button>
				</form>
			</div>
		</div>
	);
}
