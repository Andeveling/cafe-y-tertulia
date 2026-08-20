import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
	title: "UI/Tabs",
	component: Tabs,
	tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Tabs defaultValue="overview" className="w-80">
			<TabsList>
				<TabsTrigger value="overview">Resumen</TabsTrigger>
				<TabsTrigger value="history">Historial</TabsTrigger>
				<TabsTrigger value="rating">Rating</TabsTrigger>
			</TabsList>
			<TabsContent value="overview">Vista general del material.</TabsContent>
			<TabsContent value="history">Sesiones pasadas.</TabsContent>
			<TabsContent value="rating">Valoraciones del club.</TabsContent>
		</Tabs>
	),
};

export const Line: Story = {
	render: () => (
		<Tabs defaultValue="a" className="w-80">
			<TabsList variant="line">
				<TabsTrigger value="a">A</TabsTrigger>
				<TabsTrigger value="b">B</TabsTrigger>
			</TabsList>
			<TabsContent value="a">Línea A</TabsContent>
			<TabsContent value="b">Línea B</TabsContent>
		</Tabs>
	),
};
