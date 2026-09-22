/**
 * PROTOTYPE — throwaway.
 *
 * Route entry for the consolidated-TurnSpotlight prototype. Renders the
 * prototype view + the floating variant switcher.
 */

import { Suspense } from "react";
import { PrototypeView } from "@/app/prototype/turn-spotlight/prototype-view";
import { PrototypeSwitcher } from "@/app/prototype/turn-spotlight/switcher";

export const dynamic = "force-dynamic";

export default function PrototypePage() {
	return (
		<Suspense fallback={null}>
			<PrototypeView />
			<PrototypeSwitcher />
		</Suspense>
	);
}
