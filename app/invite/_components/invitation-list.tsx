"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
	formatTimeLeft,
	INVITATION_STATUS_LABELS,
	type InvitationDisplayStatus,
	type InvitationRow,
	invitationDisplayStatus,
	invitationProgress,
} from "../_lib/invitation-time";
import { revoke } from "../_lib/invite-actions";

const STATUS_VARIANT: Record<
	InvitationDisplayStatus,
	"default" | "secondary" | "outline"
> = {
	pending: "default",
	accepted: "secondary",
	expired: "outline",
	revoked: "outline",
};

export function InvitationList({
	invitations,
}: {
	invitations: InvitationRow[];
}) {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

	if (invitations.length === 0) return null;

	return (
		<div className="mt-8 space-y-3">
			<h2 className="text-sm font-medium text-muted-foreground">
				Invitaciones
			</h2>
			<ul className="space-y-2">
				{invitations.map((inv) => {
					const status = invitationDisplayStatus(inv, now);
					const { ratio, leftMs, live } = invitationProgress(
						inv.created_at,
						inv.expires_at,
						now,
					);
					return (
						<li
							key={inv.id}
							className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3"
						>
							<div className="flex items-center justify-between gap-3">
								<span className="truncate text-sm">{inv.email}</span>
								<div className="flex shrink-0 items-center gap-2">
									<Badge variant={STATUS_VARIANT[status]}>
										{INVITATION_STATUS_LABELS[status]}
									</Badge>
									{status === "pending" && (
										<form action={revoke}>
											<input type="hidden" name="id" value={inv.id} />
											<Button type="submit" variant="ghost" size="xs">
												Revocar
											</Button>
										</form>
									)}
								</div>
							</div>
							{status === "pending" && live && (
								<Progress
									value={Math.round(ratio * 100)}
									aria-label={`Tiempo restante: ${formatTimeLeft(leftMs)}`}
								>
									<ProgressLabel className="text-xs text-muted-foreground">
										Quedan {formatTimeLeft(leftMs)}
									</ProgressLabel>
								</Progress>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
