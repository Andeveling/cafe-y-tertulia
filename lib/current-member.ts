import "server-only";

import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * The current member (their public.members row), or null when there is no
 * session. The account is open (ADR-0014): anyone registers and gets an
 * `active` row with no group; the closure lives in each Group.
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
