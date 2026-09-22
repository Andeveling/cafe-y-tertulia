import type { ProtoSalaMember } from "./data";

export type SharedProps = {
	members: ProtoSalaMember[];
	youId: string;
	isModeratorView: boolean;
	onSeeAs: (id: string) => void;
	onConvocar: (id: string) => void;
	onToggleSpectator: (id: string) => void;
};
