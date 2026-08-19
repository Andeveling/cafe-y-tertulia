import { LoginForm } from "@/components/auth/login-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const metadata = {
	title: "Ingresar · Café y Tertulia",
};

export default function LoginPage() {
	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Café y Tertulia</CardTitle>
					<CardDescription>Ingresa para participar en el club.</CardDescription>
				</CardHeader>
				<CardContent>
					<LoginForm />
				</CardContent>
			</Card>
		</div>
	);
}
