"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
	createInviteLink,
	deleteGroup,
	removeMember,
	revokeInviteLink,
	updateGroup,
	updateMemberRole,
} from "@/app/g/[slug]/_lib/settings-actions";
import type { GroupRole, GroupVisibility } from "@/lib/groups/types";

export type SettingsGroup = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	avatar: string | null;
	visibility: GroupVisibility;
};

export type SettingsMember = {
	id: string;
	display_name: string;
	avatar: string | null;
	role: GroupRole;
};

/**
 * Ajustes del grupo, solo para admin (el servidor lo exige de nuevo en
 * cada acción). Presentacional para poder testearse sin Supabase.
 */
export function GroupSettingsView({
	group,
	members,
	role,
	userId,
}: {
	group: SettingsGroup;
	members: SettingsMember[];
	role: GroupRole;
	userId: string;
}) {
	if (role !== "admin") {
		return (
			<div className="flex flex-col gap-4">
				<h1 className="font-serif text-2xl font-semibold">Miembros</h1>
				<ul className="grid gap-2 sm:grid-cols-2">
					{members.map((m) => (
						<li
							key={m.id}
							className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
						>
							{m.display_name}
						</li>
					))}
				</ul>
			</div>
		);
	}
	return (
		<div className="flex flex-col gap-8">
			<InfoSection group={group} />
			<InviteSection groupId={group.id} />
			<MembersSection groupId={group.id} members={members} userId={userId} />
			<DangerSection groupId={group.id} slug={group.slug} />
		</div>
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<h2 className="font-serif text-lg font-semibold">{title}</h2>
			{children}
		</section>
	);
}

function InfoSection({ group }: { group: SettingsGroup }) {
	const [pending, start] = useTransition();
	const [name, setName] = useState(group.name);
	const [description, setDescription] = useState(group.description ?? "");
	const [visibility, setVisibility] = useState<GroupVisibility>(
		group.visibility,
	);
	const [msg, setMsg] = useState<string | null>(null);

	function handleSave() {
		const payload = {
			name,
			description: description || null,
			visibility,
		};
		start(async () => {
			const r = await updateGroup(group.id, payload);
			setMsg(r.ok ? "Guardado." : r.error);
		});
	}

	return (
		<Section title="Información del grupo">
			<label className="text-sm font-semibold">
				Nombre
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					maxLength={120}
					className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5"
				/>
			</label>
			<label className="text-sm font-semibold">
				Descripción
				<input
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5"
				/>
			</label>
			<label className="text-sm font-semibold">
				Visibilidad
				<select
					value={visibility}
					onChange={(e) =>
						setVisibility(e.target.value as "public" | "private")
					}
					className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5"
				>
					<option value="private">Privado (solo por invitación)</option>
					<option value="public">Público (descubrible)</option>
				</select>
			</label>
			{msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
			<button
				type="button"
				disabled={pending}
				onClick={handleSave}
				className="w-fit rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
			>
				Guardar
			</button>
		</Section>
	);
}

function InviteSection({ groupId }: { groupId: string }) {
	const [pending, start] = useTransition();
	const [url, setUrl] = useState<string | null>(null);
	const [msg, setMsg] = useState<string | null>(null);

	function handleGenerate() {
		start(async () => {
			const r = await createInviteLink(groupId);
			if (r.ok) {
				setUrl(r.url ?? null);
				setMsg(null);
			} else {
				setMsg(r.error);
			}
		});
	}

	return (
		<Section title="Enlace de invitación">
			<p className="text-sm text-muted-foreground">
				Comparte este enlace por cualquier canal. Regenerarlo invalida el
				anterior.
			</p>
			{url ? (
				<p className="break-all rounded-lg bg-muted px-3 py-2 text-sm">{url}</p>
			) : null}
			{msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
			<div className="flex gap-2">
				<button
					type="button"
					disabled={pending}
					onClick={handleGenerate}
					className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
				>
					Generar enlace
				</button>
				{url ? (
					<button
						type="button"
						onClick={() => void navigator.clipboard.writeText(url)}
						className="rounded-lg border border-border px-3 py-1.5 text-sm"
					>
						Copiar
					</button>
				) : null}
			</div>
		</Section>
	);
}

function MembersSection({
	groupId,
	members,
	userId,
}: {
	groupId: string;
	members: SettingsMember[];
	userId: string;
}) {
	const [pending, start] = useTransition();
	const [msg, setMsg] = useState<string | null>(null);

	function handleRoleChange(memberId: string, nextRole: string) {
		start(async () => {
			const r = await updateMemberRole(
				groupId,
				memberId,
				nextRole as GroupRole,
			);
			setMsg(r.ok ? null : r.error);
		});
	}

	function handleRemove(memberId: string) {
		start(async () => {
			const r = await removeMember(groupId, memberId);
			setMsg(r.ok ? null : r.error);
		});
	}

	return (
		<Section title={`Miembros (${members.length})`}>
			{msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
			<ul className="flex flex-col gap-2">
				{members.map((m) => (
					<li
						key={m.id}
						className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
					>
						<span className="font-medium">{m.display_name}</span>
						<span className="flex items-center gap-2">
							<select
								aria-label={`Rol de ${m.display_name}`}
								value={m.role}
								disabled={pending || m.id === userId}
								onChange={(e) => handleRoleChange(m.id, e.target.value)}
								className="rounded-md border border-border bg-background px-2 py-1"
							>
								<option value="member">member</option>
								<option value="admin">admin</option>
							</select>
							{m.id !== userId ? (
								<button
									type="button"
									disabled={pending}
									onClick={() => handleRemove(m.id)}
									className="rounded-md border border-destructive px-2 py-1 text-destructive"
								>
									Expulsar
								</button>
							) : null}
						</span>
					</li>
				))}
			</ul>
		</Section>
	);
}

function DangerSection({ groupId, slug }: { groupId: string; slug: string }) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [confirm, setConfirm] = useState("");
	const [armed, setArmed] = useState(false);
	const [msg, setMsg] = useState<string | null>(null);

	function handleDelete() {
		start(async () => {
			const r = await deleteGroup(groupId, confirm);
			if (r.ok) {
				router.push("/g");
			} else {
				setMsg(r.error);
			}
		});
	}

	function handleCancel() {
		setArmed(false);
		setConfirm("");
		setMsg(null);
	}

	return (
		<section
			aria-label="Zona de peligro"
			className="flex flex-col gap-3 rounded-xl border border-destructive p-4"
		>
			<h2 className="font-serif text-lg font-semibold">Zona de peligro</h2>
			<p className="text-sm text-muted-foreground">
				Borrar el grupo pierde para siempre sus materiales, sesiones y
				gamificación. Doble confirmación: arma el borrado y escribe el slug (
				{slug}).
			</p>
			{!armed ? (
				<button
					type="button"
					onClick={() => setArmed(true)}
					className="w-fit rounded-lg border border-destructive px-3 py-1.5 text-sm text-destructive"
				>
					Borrar grupo…
				</button>
			) : (
				<>
					<input
						aria-label="Escribe el slug para confirmar"
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						placeholder={slug}
						className="w-full rounded-lg border border-border bg-background px-3 py-1.5"
					/>
					{msg ? <p className="text-sm text-destructive">{msg}</p> : null}
					<div className="flex gap-2">
						<button
							type="button"
							disabled={pending}
							onClick={handleDelete}
							className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
						>
							Borrar para siempre
						</button>
						<button
							type="button"
							onClick={handleCancel}
							className="rounded-lg border border-border px-3 py-1.5 text-sm"
						>
							Cancelar
						</button>
					</div>
				</>
			)}
		</section>
	);
}

export function RevokeInviteButton({
	groupId,
	inviteId,
}: {
	groupId: string;
	inviteId: string;
}) {
	const [pending, start] = useTransition();
	return (
		<button
			type="button"
			disabled={pending}
			onClick={() =>
				start(() => {
					void revokeInviteLink(groupId, inviteId);
				})
			}
			className="rounded-md border border-border px-2 py-1 text-sm"
		>
			Revocar
		</button>
	);
}
