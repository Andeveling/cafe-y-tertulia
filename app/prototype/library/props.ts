import type { MaterialKind } from "@/app/materials/_lib/constants";
import type { ProtoBibliotecaItem } from "./data";

export type BibliotecaDraft = {
	title: string;
	author: string;
	kind: MaterialKind;
	motive: string;
};

export type SharedProps = {
	items: ProtoBibliotecaItem[];
	onAdd: (draft: BibliotecaDraft) => void;
	onDelete: (id: string) => void;
};
