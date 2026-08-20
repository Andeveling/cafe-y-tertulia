import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./dialog";

const meta = {
	title: "UI/Dialog",
	component: Dialog,
	tags: ["autodocs"],
	parameters: { layout: "centered" },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Dialog>
			<DialogTrigger render={<Button />}>Abrir diálogo</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Confirmar cierre</DialogTitle>
					<DialogDescription>
						La sesión se archivará y no se podrán añadir más votos.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>
						Cancelar
					</DialogClose>
					<DialogClose render={<Button />}>Cerrar sesión</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
};
