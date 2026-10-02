"use client";

import { Cancel01Icon, SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import {
	filterShelfMaterials,
	isShelfFiltered,
	presentShelfKinds,
	presentShelfStatuses,
	type ShelfFilters,
	type ShelfKindFilter,
	type ShelfQuery,
	type ShelfStatusFilter,
} from "@/app/g/[slug]/materials/_lib/filter-shelf";
import { MaterialsGrid } from "@/app/materials/_components/materials-grid";
import {
	MATERIAL_KIND_LABELS,
	MATERIAL_STATUS_LABELS,
} from "@/app/materials/_lib/constants";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const chipClassName = "min-h-11 rounded-full px-4";
const chosenChipClassName = `${chipClassName} aria-pressed:border-primary! aria-pressed:bg-primary! aria-pressed:text-primary-foreground! data-[state=on]:border-primary! data-[state=on]:bg-primary! data-[state=on]:text-primary-foreground!`;

type CatalogMaterial = ShelfQuery & {
	id: string;
	image_url: string | null;
	sessions_count: number;
	rating_avg: number | null;
	rating_count: number;
};

/** El catálogo ya llegó entero. Buscar y filtrar no vuelve a pedir la estantería. */
export function ShelfCatalog({ materials }: { materials: CatalogMaterial[] }) {
	const [query, setQuery] = useState("");
	const [kind, setKind] = useState<ShelfKindFilter>("all");
	const [status, setStatus] = useState<ShelfStatusFilter>("all");
	const filters: ShelfFilters = { query, kind, status };
	const visible = filterShelfMaterials(materials, filters);
	const filtering = isShelfFiltered(filters);
	const kinds = presentShelfKinds(materials);
	const statuses = presentShelfStatuses(materials);
	const hasFilters = kinds.length > 0 || statuses.length > 0;

	function reset() {
		setQuery("");
		setKind("all");
		setStatus("all");
	}

	return (
		<div className="flex flex-col gap-6">
			<form
				role="search"
				aria-label="Buscar y filtrar materiales"
				className="flex flex-col gap-4"
				onSubmit={(event) => event.preventDefault()}
			>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
					<InputGroup className="h-11 flex-1 bg-input/30">
						<InputGroupAddon>
							<HugeiconsIcon
								icon={SearchIcon}
								strokeWidth={2}
								className="size-4"
								aria-hidden="true"
							/>
						</InputGroupAddon>
						<InputGroupInput
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Título o autor"
							aria-label="Buscar en la estantería"
							autoComplete="off"
						/>
						{query ? (
							<InputGroupAddon align="inline-end">
								<InputGroupButton
									aria-label="Borrar búsqueda"
									size="icon-sm"
									onClick={() => setQuery("")}
								>
									<HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
								</InputGroupButton>
							</InputGroupAddon>
						) : null}
					</InputGroup>
					<div className="flex shrink-0 items-center gap-2">
						<p aria-live="polite" className="text-sm text-muted-foreground">
							{countLabel(visible.length, materials.length)}
						</p>
						{filtering ? (
							<Button
								type="button"
								variant="ghost"
								className="min-h-11 px-2"
								onClick={reset}
							>
								Limpiar
							</Button>
						) : null}
					</div>
				</div>

				{hasFilters ? (
					<div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-3">
						{kinds.length > 0 ? (
							<ShelfFilterField
								legend="Formato"
								value={kind}
								options={kinds.map((value) => ({
									value,
									label: MATERIAL_KIND_LABELS[value],
								}))}
								onChange={(next) => setKind(next as ShelfKindFilter)}
							/>
						) : null}
						{kinds.length > 0 && statuses.length > 0 ? (
							<Separator
								orientation="vertical"
								className="hidden h-6 md:block"
								aria-hidden="true"
							/>
						) : null}
						{statuses.length > 0 ? (
							<ShelfFilterField
								legend="Estado"
								value={status}
								options={statuses.map((value) => ({
									value,
									label: MATERIAL_STATUS_LABELS[value],
								}))}
								onChange={(next) => setStatus(next as ShelfStatusFilter)}
							/>
						) : null}
					</div>
				) : null}
			</form>

			{visible.length === 0 ? (
				<Empty className="border border-dashed border-border/70">
					<EmptyHeader>
						<EmptyTitle>Nada coincide</EmptyTitle>
						<EmptyDescription>
							Prueba otras palabras o quita un filtro. La estantería sigue
							teniendo {materialNoun(materials.length)}.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button
							type="button"
							variant="outline"
							className="min-h-11"
							onClick={reset}
						>
							Ver toda la estantería
						</Button>
					</EmptyContent>
				</Empty>
			) : (
				<MaterialsGrid
					materials={visible.map((item) => ({
						...item,
						created_at: "",
						source_url: null,
					}))}
				/>
			)}
		</div>
	);
}

/**
 * Un fieldset por dimensión: el legend nombra el grupo para el lector de
 * pantalla y la etiqueta visible mantiene el escaneo rápido.
 */
function ShelfFilterField({
	legend,
	value,
	options,
	onChange,
}: {
	legend: string;
	value: string;
	options: { value: string; label: string }[];
	onChange: (value: string) => void;
}) {
	return (
		<FieldSet className="flex-row flex-wrap items-center gap-2">
			<FieldLegend
				variant="label"
				className="mb-0 shrink-0 font-normal text-muted-foreground"
			>
				{legend}
			</FieldLegend>
			<ToggleGroup
				variant="outline"
				spacing={2}
				value={[value]}
				className="flex-wrap"
				onValueChange={(next) => {
					const picked = next[0];
					if (picked) onChange(picked);
				}}
			>
				<ToggleGroupItem value="all" className={chipClassName}>
					Todos
				</ToggleGroupItem>
				{options.map((option) => (
					<ToggleGroupItem
						key={option.value}
						value={option.value}
						className={chosenChipClassName}
					>
						{option.label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</FieldSet>
	);
}

function materialNoun(count: number): string {
	return count === 1 ? "1 material" : `${count} materiales`;
}

function countLabel(visible: number, total: number): string {
	if (visible === total) return materialNoun(total);
	return `${visible} de ${materialNoun(total)}`;
}
