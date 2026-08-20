import { z } from "zod";

export const resetSchema = z.object({
	email: z.email("El email no parece válido."),
});

export type ResetValues = z.infer<typeof resetSchema>;
