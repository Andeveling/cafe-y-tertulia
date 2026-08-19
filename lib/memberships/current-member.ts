import "server-only";

import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * The current member (their public.members row), or null when there is no
 * session. Every authenticated area of the app needs a members row — the
 * club is a closed list (ADR 0005).
 */
export async function getCurrentMember() {
	const supabase = await createServerClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return { supabase, member: null };
	}

	const { data: member } = await supabase
		.from("members")
		.select("*")
		.eq("id", user.id)
		.maybeSingle();

	return { supabase, member };
}
