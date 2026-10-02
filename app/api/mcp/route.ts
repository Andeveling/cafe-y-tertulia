import type {
	AuthInfo,
	CallToolResult,
	ServerContext,
} from "@modelcontextprotocol/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import {
	type BibliotecaInput,
	bibliotecaInputSchema,
	normalizeBibliotecaInput,
} from "@/app/materials/_lib/biblioteca-schema";
import type { Database } from "@/lib/supabase/database.types";
import { createMcpUserClient } from "@/lib/supabase/mcp-user-client";

export const dynamic = "force-dynamic";

/** Misma proyección y orden que listBiblioteca: el MCP no reinventa la lectura. */
const BIBLIOTECA_SELECT =
	"id, owner_id, title, kind, author, image_url, source_url, motive, created_at";

function textResult(value: unknown): CallToolResult {
	return {
		content: [{ type: "text", text: JSON.stringify(value) }],
	};
}

function toolError(message: string): CallToolResult {
	return {
		content: [{ type: "text", text: message }],
		isError: true,
	};
}

/** Lee la biblioteca propia, de la más reciente a la más antigua. */
export async function listBibliotecaItems(
	client: SupabaseClient<Database>,
	args: { userId: string },
): Promise<CallToolResult> {
	const { data, error } = await client
		.from("library_items")
		.select(BIBLIOTECA_SELECT)
		.eq("owner_id", args.userId)
		.order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return textResult(data ?? []);
}

export type CreateBibliotecaItemArgs = {
	userId: string;
	input: BibliotecaInput;
};

/** Normaliza y guarda un material con el dueño que trae el token. */
export async function createBibliotecaItem(
	client: SupabaseClient<Database>,
	args: CreateBibliotecaItemArgs,
): Promise<CallToolResult> {
	const normalized = normalizeBibliotecaInput(args.input);
	const { data, error } = await client
		.from("library_items")
		.insert({ ...normalized, owner_id: args.userId })
		.select("id")
		.single();
	if (error) throw new Error(error.message);
	return textResult({ id: data.id });
}

export type NominateBibliotecaItemArgs = {
	libraryItemId: string;
	groupId: string;
};

/** Postula un item propio hacia un grupo; el RPC valida todo de forma atómica. */
export async function nominateBibliotecaItem(
	client: SupabaseClient<Database>,
	args: NominateBibliotecaItemArgs,
): Promise<CallToolResult> {
	const { error } = await client.rpc("nominate_from_library", {
		p_library_item_id: args.libraryItemId,
		p_group_id: args.groupId,
	});
	if (error) {
		return toolError(`No se pudo postular el material: ${error.message}`);
	}
	return textResult({ ok: true });
}

export type WithdrawPostulacionArgs = {
	nominationId: string;
};

/** Retira una postulación activa propia antes del bloqueo. */
export async function withdrawPostulacion(
	client: SupabaseClient<Database>,
	args: WithdrawPostulacionArgs,
): Promise<CallToolResult> {
	const { error } = await client.rpc("withdraw_nomination", {
		p_nomination_id: args.nominationId,
	});
	if (error) {
		return toolError(`No se pudo retirar la postulación: ${error.message}`);
	}
	return textResult({ ok: true });
}

const uuidSchema = (label: string) => z.string().uuid(`${label} no es válido.`);

/**
 * Valida el Bearer contra Supabase y devuelve la identidad para withMcpAuth.
 * Sin token o con token inválido devuelve undefined (con required:true eso es 401).
 */
export async function verifyToken(
	_request: Request,
	bearerToken?: string,
): Promise<AuthInfo | undefined> {
	if (!bearerToken) return undefined;
	try {
		// Cliente anon efímero: solo valida el JWT, no guarda sesión.
		const supabase = createClient<Database>(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
			{
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			},
		);
		const { data, error } = await supabase.auth.getUser(bearerToken);
		if (error || !data.user) return undefined;
		return {
			token: bearerToken,
			scopes: [],
			clientId: data.user.id,
			extra: { userId: data.user.id },
		};
	} catch {
		return undefined;
	}
}

/** Resuelve cliente + dueño desde el token ya verificado por withMcpAuth. */
function resolveMcpClient(ctx: ServerContext) {
	const authInfo = ctx.http?.authInfo;
	const extraUserId = (authInfo?.extra as { userId?: string } | undefined)
		?.userId;
	const userId = extraUserId ?? authInfo?.clientId;
	if (!authInfo || !userId) {
		throw new Error("Falta autenticación: envía un Bearer token válido.");
	}
	return { client: createMcpUserClient(authInfo.token), userId };
}

const handler = createMcpHandler(
	(server) => {
		server.registerTool(
			"biblioteca_list",
			{
				description:
					"Lista los materiales de tu biblioteca personal, del más reciente al más antiguo.",
				inputSchema: z.object({}),
			},
			async (_args, ctx) => {
				const { client, userId } = resolveMcpClient(ctx);
				return listBibliotecaItems(client, { userId });
			},
		);
		server.registerTool(
			"biblioteca_create",
			{
				description:
					"Guarda un material en tu biblioteca personal (libro, podcast, video o artículo).",
				inputSchema: bibliotecaInputSchema,
			},
			async (args, ctx) => {
				const { client, userId } = resolveMcpClient(ctx);
				return createBibliotecaItem(client, { userId, input: args });
			},
		);
		server.registerTool(
			"biblioteca_nominate",
			{
				description:
					"Postula un material de tu biblioteca a un grupo para el próximo debate.",
				inputSchema: z.object({
					libraryItemId: uuidSchema("El material"),
					groupId: uuidSchema("El grupo"),
				}),
			},
			async (args, ctx) => {
				const { client } = resolveMcpClient(ctx);
				return nominateBibliotecaItem(client, args);
			},
		);
		server.registerTool(
			"postulacion_withdraw",
			{
				description:
					"Retira una postulación activa tuya antes de que se bloquee.",
				inputSchema: z.object({
					nominationId: uuidSchema("La postulación"),
				}),
			},
			async (args, ctx) => {
				const { client } = resolveMcpClient(ctx);
				return withdrawPostulacion(client, args);
			},
		);
	},
	{
		serverInfo: { name: "cafe-y-tertulia-biblioteca", version: "1.0.0" },
	},
);

const authenticatedHandler = withMcpAuth(handler, verifyToken, {
	required: true,
	resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

// DELETE lo responde el propio handler (stateless: 405), no el framework.
export {
	authenticatedHandler as DELETE,
	authenticatedHandler as GET,
	authenticatedHandler as POST,
};
