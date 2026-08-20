"use client";

import { useEffect, useState } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { AcceptInvitationState } from "../_lib/accept-invitation-actions";

export type InviteSessionStatus =
	| "loading"
	| "ready"
	| "invalid_or_expired"
	| "update_failed";

export function useInviteSession(formState: AcceptInvitationState) {
	const [status, setStatus] = useState<InviteSessionStatus>("loading");

	useEffect(() => {
		const supabase = createBrowserClient();
		// Invite email lands with session in the URL fragment
		// (access_token + type=invite). The browser client picks it up.
		supabase.auth
			.getSession()
			.then(({ data }) => {
				setStatus(data.session ? "ready" : "invalid_or_expired");
			})
			.catch(() => setStatus("invalid_or_expired"));
	}, []);

	useEffect(() => {
		if (!formState?.error) return;
		setStatus(
			formState.error === "invalid_or_expired"
				? "invalid_or_expired"
				: "update_failed",
		);
	}, [formState]);

	return status;
}
