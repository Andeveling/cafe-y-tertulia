import { AcceptInvitationForm } from "./accept-invitation-form";

export type AcceptInviteViewProps =
	| { state: "ready"; email: string; token: string }
	| { state: "expired" }
	| { state: "invalid" };

export function AcceptInviteView(props: AcceptInviteViewProps) {
	if (props.state === "expired") {
		return (
			<div className="space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">
					Este enlace caducó
				</h1>
				<p className="text-sm text-muted-foreground">
					Pedile a tu padrino que te reenvíe uno nuevo.
				</p>
			</div>
		);
	}

	if (props.state === "invalid") {
		return (
			<div className="space-y-2 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">
					Invitación no válida
				</h1>
				<p className="text-sm text-muted-foreground">
					Este enlace no es válido o ya fue usado. Pedile a tu padrino que te
					reenvíe la invitación.
				</p>
			</div>
		);
	}

	return <AcceptInvitationForm email={props.email} token={props.token} />;
}
