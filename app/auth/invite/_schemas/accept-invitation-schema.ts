import { z } from "zod";

export const acceptInvitationSchema = z
	.object({
		token: z.string().min(1),
		email: z.email(),
		displayName: z
			.string()
			.trim()
			.min(2, "El nombre debe tener al menos 2 caracteres.")
			.max(60, "El nombre no puede superar los 60 caracteres."),
		password: z
			.string()
			.min(6, "La contraseña debe tener al menos 6 caracteres."),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Las contraseñas no coinciden.",
		path: ["confirmPassword"],
	});

export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;
