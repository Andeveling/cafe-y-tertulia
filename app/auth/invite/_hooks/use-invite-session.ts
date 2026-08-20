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
		// El invite llega con access_token/refresh_token en el fragment (#)
		// via GoTrue. @supabase/ssr no siempre lo hydrata solo, así que lo
		// seteamos explícitamente si está en la URL y luego verificamos.
		async function init() {
			try {
				const hash = window.location.hash;
				if (hash.includes("access_token")) {
					const params = new URLSearchParams(hash.slice(1));
					const access_token = params.get("access_token");
					const refresh_token = params.get("refresh_token");
					if (access_token && refresh_token) {
						const { error } = await supabase.auth.setSession({
							access_token,
							refresh_token,
						});
						if (error) {
							setStatus("invalid_or_expired");
							return;
						}
					}
				}
				const { data } = await supabase.auth.getSession();
				setStatus(data.session ? "ready" : "invalid_or_expired");
			} catch {
				setStatus("invalid_or_expired");
			}
		}
		init();
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
