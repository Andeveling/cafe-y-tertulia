import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "./sheet";

const meta = {
	title: "UI/Sheet",
	component: Sheet,
	tags: ["autodocs"],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {
	render: () => (
		<Sheet>
			<SheetTrigger render={<Button variant="outline" />}>
				Abrir sheet
			</SheetTrigger>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Detalle</SheetTitle>
					<SheetDescription>Panel lateral del material.</SheetDescription>
				</SheetHeader>
				<div className="flex-1 p-4 text-sm text-muted-foreground">
					Contenido…
				</div>
				<SheetFooter>
					<Button className="w-full">Guardar</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	),
};

export const Left: Story = {
	render: () => (
		<Sheet>
			<SheetTrigger render={<Button variant="outline" />}>
				Izquierda
			</SheetTrigger>
			<SheetContent side="left">
				<SheetHeader>
					<SheetTitle>Menú</SheetTitle>
					<SheetDescription>Navegación</SheetDescription>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	),
};
