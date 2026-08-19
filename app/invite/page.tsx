import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { invite } from "@/lib/memberships/actions";
import { getCurrentMember } from "@/lib/memberships/current-member";
import { createClient as createServerClient } from "@/lib/supabase/server";

const INVITE_ERRORS: Record<string, string> = {
	invalid_email: "Ese email no parece válido.",
	not_active_member: "Solo los Miembros activos pueden invitar.",
	already_member: "Esa persona ya es Miembro del club.",
	left_member: "Esa persona se dio de baja del club.",
	already_invited_pending:
		"Ya le enviamos una invitación a ese email. Esperá a que venza o que la acepte.",
	send_failed:
		"No pudimos enviar la invitación. Intentá de nuevo en un momento.",
};

export default async function InvitePage({
	searchParams,
}: {
	searchParams: Promise<{ invited?: string; error?: string }>;
}) {
	const params = await searchParams;
	const { supabase, member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	if (member.status !== "active") {
		redirect("/");
	}

	const { data: invitations } = await supabase
		.from("invitations")
		.select("id, email, status, expires_at, created_at")
		.eq("invited_by", member.id)
		.order("created_at", { ascending: false });

	const now = Date.now();
	const pending = (invitations ?? []).filter(
		(i) => i.status === "pending" && new Date(i.expires_at).getTime() > now,
	);

	return (
		<div className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">Invitar</h1>
				<p className="text-sm text-muted-foreground">
					Cualquier Miembro activo puede invitar a una nueva persona al club. La
					invitación vence a las 24 horas.
				</p>
			</div>

			{params.invited === "1" && (
				<div
					role="status"
					className="mt-4 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground"
				>
					Invitación enviada. Cuando la persona acepte, se sumará al club.
				</div>
			)}

			{params.error && INVITE_ERRORS[params.error] && (
				<div
					role="alert"
					className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
				>
					{INVITE_ERRORS[params.error]}
				</div>
			)}

			<Card className="mt-6">
				<CardHeader>
					<CardTitle>Nueva invitación</CardTitle>
					<CardDescription>
						La persona recibe un correo en español con un enlace de un solo uso,
						válido por 24 horas.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={invite} className="flex flex-col gap-4 sm:flex-row">
						<Field className="flex-1">
							<FieldLabel htmlFor="email" className="sr-only">
								Email
							</FieldLabel>
							<FieldContent>
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="off"
									required
									placeholder="correo@ejemplo.com"
								/>
							</FieldContent>
						</Field>
						<Button type="submit">Enviar invitación</Button>
					</form>
				</CardContent>
			</Card>

			{pending.length > 0 && (
				<div className="mt-8 space-y-3">
					<h2 className="text-sm font-medium text-muted-foreground">
						Invitaciones pendientes
					</h2>
					<ul className="space-y-2">
						{pending.map((inv) => (
							<li
								key={inv.id}
								className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
							>
								<span>{inv.email}</span>
								<span className="text-xs text-muted-foreground">
									vence {new Date(inv.expires_at).toLocaleString("es")}
								</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
