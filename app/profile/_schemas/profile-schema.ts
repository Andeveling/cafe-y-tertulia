import { z } from "zod";

export const displayNameSchema = z.object({
	displayName: z
		.string()
		.trim()
		.min(1, "Elegí un nombre visible.")
		.max(60, "El nombre no puede superar los 60 caracteres."),
});

export type DisplayNameValues = z.infer<typeof displayNameSchema>;
