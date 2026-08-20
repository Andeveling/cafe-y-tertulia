import { z } from "zod";

export const inviteSchema = z.object({
	email: z.email("Ese email no parece válido."),
});

export type InviteValues = z.infer<typeof inviteSchema>;
