"use client";

import { createContext, useContext } from "react";
import type { GroupContextValue } from "@/lib/groups/types";

const GroupContext = createContext<GroupContextValue | null>(null);

/** Contexto del grupo actual: group_id, slug, rol y metadatos. */
export function GroupProvider({
	value,
	children,
}: {
	value: GroupContextValue;
	children: React.ReactNode;
}) {
	return (
		<GroupContext.Provider value={value}>{children}</GroupContext.Provider>
	);
}

export function useGroup(): GroupContextValue {
	const ctx = useContext(GroupContext);
	if (!ctx) throw new Error("useGroup debe usarse dentro de /g/{slug}");
	return ctx;
}
