import { z } from "zod";

export const acceptInvitationSchema = z.object({
	displayName: z
		.string()
		.trim()
		.min(1, "Elegí un nombre visible.")
		.max(60, "El nombre no puede superar los 60 caracteres."),
	password: z
		.string()
		.min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;
