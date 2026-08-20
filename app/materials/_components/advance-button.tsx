"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTransition } from "react";
import { toast } from "sonner";
import { advanceMaterial, advanceSession } from "@/app/materials/actions";
import { Button } from "@/components/ui/button";

type Props =
	| { kind: "material"; id: string }
	| { kind: "session"; id: string; materialId: string };

export function AdvanceButton(props: Props) {
	const [isPending, startTransition] = useTransition();

	const label = props.kind === "material" ? "Avanzar estado" : "Avanzar sesión";

	return (
		<Button
			variant="outline"
			size="sm"
			disabled={isPending}
			onClick={() =>
				startTransition(async () => {
					const result =
						props.kind === "material"
							? await advanceMaterial(props.id)
							: await advanceSession({
									sessionId: props.id,
									materialId: props.materialId,
								});
					if ("error" in result) {
						toast.error(result.error);
					} else {
						toast.success(
							props.kind === "material"
								? "Material avanzado en el pipeline"
								: "Sesión avanzada",
						);
					}
				})
			}
		>
			<HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-start" />
			{label}
		</Button>
	);
}
