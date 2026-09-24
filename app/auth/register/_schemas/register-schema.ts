import { z } from "zod";

export const registerSchema = z
	.object({
		email: z.email("El email no parece válido."),
		displayName: z
			.string()
			.trim()
			.min(2, "El nombre debe tener al menos 2 caracteres.")
			.max(60, "El nombre no puede superar los 60 caracteres."),
		password: z
			.string()
			.min(6, "La contraseña debe tener al menos 6 caracteres."),
		confirmPassword: z.string(),
		next: z.string().optional(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Las contraseñas no coinciden.",
		path: ["confirmPassword"],
	});

export type RegisterValues = z.infer<typeof registerSchema>;
