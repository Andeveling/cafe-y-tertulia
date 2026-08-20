import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";

const meta = {
	title: "UI/Alert",
	component: Alert,
	tags: ["autodocs"],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Alert className="max-w-md">
			<AlertTitle>Sesión lista</AlertTitle>
			<AlertDescription>El material ya puede abrirse al club.</AlertDescription>
		</Alert>
	),
};

export const Destructive: Story = {
	render: () => (
		<Alert variant="destructive" className="max-w-md">
			<AlertTitle>No se pudo guardar</AlertTitle>
			<AlertDescription>
				Revisa la conexión e inténtalo de nuevo.
			</AlertDescription>
			<AlertAction>
				<Button size="xs" variant="outline">
					Reintentar
				</Button>
			</AlertAction>
		</Alert>
	),
};
