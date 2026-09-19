import { z } from "zod";
import { AVATARS } from "@/lib/avatars";

export const displayNameSchema = z.object({
	displayName: z
		.string()
		.trim()
		.min(1, "Elegí un nombre visible.")
		.max(60, "El nombre no puede superar los 60 caracteres."),
});

export type DisplayNameValues = z.infer<typeof displayNameSchema>;

const avatarSrcs = AVATARS.map((a) => a.src) as [string, ...string[]];

/** `avatar` vacío = volver a las iniciales. */
export const avatarSchema = z.object({
	avatar: z.enum(avatarSrcs).or(z.literal("")).optional(),
});

export type AvatarValues = z.infer<typeof avatarSchema>;
