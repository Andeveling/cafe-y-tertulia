import type { AdvanceDecision, ProtoMember } from "./data";

export type SharedProps = {
	members: ProtoMember[];
	youId: string;
	isModeratorView: boolean;
	onSeeAs: (id: string) => void;
	onSaveMine: (text: string) => void;
	onOptOut: (id: string, next: boolean) => void;
	onConvocar: (id: string) => void;
	decisions: AdvanceDecision;
	onDecide: (id: string, d: "wait" | "spectator") => void;
	onAdvance: () => void;
	advanced: boolean;
};
