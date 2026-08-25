import { z } from "zod";

export const registerSchema = z.object({
	email: z.email("El email no parece válido."),
	displayName: z
		.string()
		.trim()
		.min(1, "Elegí un nombre visible.")
		.max(60, "El nombre no puede superar los 60 caracteres."),
	password: z
		.string()
		.min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export type RegisterValues = z.infer<typeof registerSchema>;
