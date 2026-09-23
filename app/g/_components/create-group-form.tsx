"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createGroup } from "@/app/g/_lib/group-actions";
import type { GroupVisibility } from "@/lib/groups/types";

export function CreateGroupForm() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [visibility, setVisibility] = useState<GroupVisibility>("private");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			const result = await createGroup({
				name,
				description: description || null,
				visibility,
			});
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setOpen(false);
			setName("");
			setDescription("");
			router.refresh();
		} finally {
			setBusy(false);
		}
	}

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
			>
				Crear grupo
			</button>
		);
	}

	return (
		<form
			className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
			onSubmit={handleSubmit}
		>
			<label className="text-sm font-semibold">
				Nombre
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5"
					maxLength={120}
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
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
			<div className="flex gap-2">
				<button
					type="submit"
					disabled={busy}
					className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
				>
					Crear
				</button>
				<button
					type="button"
					onClick={() => setOpen(false)}
					className="rounded-lg border border-border px-3 py-1.5 text-sm"
				>
					Cancelar
				</button>
			</div>
		</form>
	);
}
