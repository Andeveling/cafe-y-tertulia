import "server-only";

import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// Primitivas Zod que reemplazan a `json-helpers.ts`.
//
// Cada una acepta `Json | undefined` (lo que devuelve Supabase RPC) y
// produce el tipo de dominio con fallback. Usar `.catch(fallback)` en vez
// de `.default()` para que valores del tipo incorrecto (p. ej. número donde
// se esperaba string) también caigan al fallback en lugar de lanzar.
// La interfaz es pequeña (5 primitivas + 1 decodificador); la
// implementación (validación, coerción, mensajes con ruta) es profunda.
// ---------------------------------------------------------------------------

/** String con fallback "" — reemplaza `asString(v)` */
export const jString = z.string().catch("");

/** String | null con fallback null — reemplaza `asNullString(v)` */
export const jNullString = z
	.string()
	.nullable()
	.catch(null) as unknown as z.ZodType<string | null>;

/** Number con fallback 0 — reemplaza `asNumber(v)` */
export const jNumber = z.number().catch(0);

/** Boolean con fallback false — reemplaza `asBool(v)` */
export const jBool = z.boolean().catch(false);

/** Array con fallback [] — reemplaza `asArray(v)` */
export function jArray<T extends z.ZodTypeAny>(
	item: T,
): z.ZodType<z.infer<T>[]> {
	return z.array(item).catch([] as z.infer<T>[]) as unknown as z.ZodType<
		z.infer<T>[]
	>;
}

// ---------------------------------------------------------------------------
// Decodificador genérico para respuestas RPC.
//
// Supabase RPC devuelve `Json`. Este helper valida que sea un objeto
// no-array, lo parsea con el schema y devuelve `null` si no es válido —
// mismo contrato que cada `getXSnapshot` tenía duplicado en 5 archivos.
// Un cambio de contrato RPC se arregla en un schema, no en N archivos.
// ---------------------------------------------------------------------------

export function decodeSnapshot<T>(
	raw: Json | null | undefined,
	schema: z.ZodType<T>,
): T | null {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
	const result = schema.safeParse(raw);
	if (!result.success) return null;
	return result.data;
}
