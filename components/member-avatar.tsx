"use client";

import {
	Avatar,
	AvatarBadge,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { resolveAvatar } from "@/lib/avatars";

/** Iniciales de un nombre visible ("Ana María" → "AM"). */
export function memberInitials(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "CT";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type MemberAvatarProps = {
	/** Nombre visible — alt de la imagen y base de las iniciales. */
	name: string;
	/** Valor de `members.avatar` (src del catálogo o null). */
	avatar?: string | null;
	size?: "default" | "sm" | "lg";
	className?: string;
	/** Punto de presencia (roster en línea). */
	badge?: boolean;
};

/**
 * Avatar del club en un solo sitio: imagen del catálogo cuando el miembro
 * eligió una, iniciales como respaldo. Úsalo en vez de componer
 * Avatar/AvatarImage/AvatarFallback a mano.
 */
export function MemberAvatar({
	name,
	avatar,
	size = "default",
	className,
	badge = false,
}: MemberAvatarProps) {
	const src = resolveAvatar(avatar);
	return (
		<Avatar size={size} className={className}>
			{src ? <AvatarImage src={src} alt={name} draggable={false} /> : null}
			<AvatarFallback>{memberInitials(name)}</AvatarFallback>
			{badge && <AvatarBadge />}
		</Avatar>
	);
}
