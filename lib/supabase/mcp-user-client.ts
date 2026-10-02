import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cliente Supabase que actúa como el llamante MCP (issue MCP Biblioteca).
 * Usa la anon key con `Authorization: Bearer <jwt>` global para que
 * PostgREST/RPCs corran como el usuario y RLS + auth.uid() sigan valiendo.
 * Un cliente nuevo por llamada (regla Fluid: nunca global) y nunca service_role.
 */
export function createMcpUserClient(jwt: string) {
	return createClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
		{
			global: {
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			},
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		},
	);
}
