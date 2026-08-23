import "server-only";
import type { Json } from "@/lib/supabase/database.types";

export function asString(v: Json | undefined, fallback = ""): string {
	return typeof v === "string" ? v : fallback;
}

export function asBool(v: Json | undefined, fallback = false): boolean {
	return typeof v === "boolean" ? v : fallback;
}

export function asNumber(v: Json | undefined, fallback = 0): number {
	return typeof v === "number" ? v : fallback;
}

export function asNullString(v: Json | undefined): string | null {
	return typeof v === "string" ? v : null;
}

export function asArray<T>(v: Json | undefined): T[] {
	return Array.isArray(v) ? (v as T[]) : [];
}
