import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "./dropdown-menu";

const meta = {
	title: "UI/DropdownMenu",
	component: DropdownMenu,
	tags: ["autodocs"],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" />}>
				Menú
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-48">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Cuenta</DropdownMenuLabel>
					<DropdownMenuItem>
						Perfil
						<DropdownMenuShortcut>⇧P</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>Invitar</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant="destructive">Cerrar sesión</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	),
};
