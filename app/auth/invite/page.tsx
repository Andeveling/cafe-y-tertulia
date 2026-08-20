import { AcceptInvitationForm } from "./_components/accept-invitation-form";

export default function InviteAcceptPage() {
	return (
		<div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm">
				<AcceptInvitationForm />
			</div>
		</div>
	);
}
