import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DatePicker } from "./date-picker";

function DatePickerDemo() {
	const [date, setDate] = useState<Date | undefined>(undefined);
	return <DatePicker date={date} onSelect={setDate} />;
}

function DatePickerWithDate() {
	const [date, setDate] = useState<Date | undefined>(new Date());
	return <DatePicker date={date} onSelect={setDate} />;
}

const meta = {
	title: "UI/DatePicker",
	component: DatePicker,
	tags: ["autodocs"],
	args: {
		date: undefined,
		onSelect: () => {},
	},
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
	render: () => <DatePickerDemo />,
};

export const WithSelectedDate: Story = {
	args: {},
	render: () => <DatePickerWithDate />,
};
