import { z } from "zod";

export const loginSchema = z.object({
	email: z.email("El email no parece válido."),
	password: z.string().min(1, "Ingresá tu contraseña."),
});

export type LoginValues = z.infer<typeof loginSchema>;
