import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./card";

const meta = {
	title: "UI/Card",
	component: Card,
	tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Card className="w-80">
			<CardHeader>
				<CardTitle>Material de lectura</CardTitle>
				<CardDescription>Próxima tertulia del club.</CardDescription>
				<CardAction>
					<Button size="xs" variant="outline">
						Editar
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				Resumen corto del libro y notas de la moderación.
			</CardContent>
			<CardFooter className="justify-end gap-2">
				<Button variant="ghost" size="sm">
					Cancelar
				</Button>
				<Button size="sm">Abrir</Button>
			</CardFooter>
		</Card>
	),
};

export const Small: Story = {
	render: () => (
		<Card size="sm" className="w-72">
			<CardHeader>
				<CardTitle>Compacta</CardTitle>
				<CardDescription>size=&quot;sm&quot;</CardDescription>
			</CardHeader>
			<CardContent>Menos padding.</CardContent>
		</Card>
	),
};
