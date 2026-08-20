import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
} from "./field";
import { Input } from "./input";

const meta = {
	title: "UI/Field",
	component: Field,
	tags: ["autodocs"],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<FieldSet className="w-80">
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input id="email" type="email" placeholder="tu@email.com" />
					<FieldDescription>Usamos el email de la membresía.</FieldDescription>
				</Field>
				<Field data-invalid>
					<FieldLabel htmlFor="name">Nombre</FieldLabel>
					<Input id="name" aria-invalid defaultValue="" />
					<FieldError>El nombre es obligatorio.</FieldError>
				</Field>
			</FieldGroup>
		</FieldSet>
	),
};
