import { peekInviteToken } from "@/app/invite/_lib/invite";
import { AcceptInviteView } from "./_components/accept-invite-view";

export default async function InviteAcceptPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;
	if (!token) {
		return (
			<div className="flex min-h-dvh flex-1 flex-col items-center justify-center px-4">
				<div className="w-full max-w-sm">
					<AcceptInviteView state="invalid" />
				</div>
			</div>
		);
	}

	const peeked = await peekInviteToken(token);

	return (
		<div className="flex min-h-dvh flex-1 flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm">
				{peeked.ok ? (
					<AcceptInviteView state="ready" email={peeked.email} token={token} />
				) : (
					<AcceptInviteView state={peeked.code} />
				)}
			</div>
		</div>
	);
}
